/**
 * Database Migration Script
 * Runs pending migrations on Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const error = (message) => {
  log(`❌ ${message}`, 'red');
};

const success = (message) => {
  log(`✅ ${message}`, 'green');
};

const info = (message) => {
  log(`ℹ️  ${message}`, 'blue');
};

const warning = (message) => {
  log(`⚠️  ${message}`, 'yellow');
};

// Initialize Supabase client
const initSupabase = () => {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    error('Supabase credentials not found in environment variables');
    process.exit(1);
  }

  return createClient(supabaseUrl, supabaseKey);
};

// Get all migration files
const getMigrationFiles = () => {
  const migrationsDir = path.join(__dirname, '..', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    error('Migrations directory not found');
    return [];
  }

  const files = fs.readdirSync(migrationsDir);
  return files
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => ({
      name: file,
      path: path.join(migrationsDir, file),
    }));
};

// Read migration file
const readMigration = (filePath) => {
  return fs.readFileSync(filePath, 'utf8');
};

// Create migrations table if not exists
const createMigrationsTable = async (supabase) => {
  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,
  });

  if (createError) {
    throw new Error(`Failed to create migrations table: ${createError.message}`);
  }
};

// Get executed migrations
const getExecutedMigrations = async (supabase) => {
  const { data, error: fetchError } = await supabase
    .from('migrations')
    .select('name')
    .order('executed_at', { ascending: true });

  if (fetchError) {
    throw new Error(`Failed to fetch migrations: ${fetchError.message}`);
  }

  return data.map((row) => row.name);
};

// Execute migration
const executeMigration = async (supabase, migration) => {
  info(`Executing migration: ${migration.name}`);

  const sql = readMigration(migration.path);

  // Execute migration SQL
  const { error: execError } = await supabase.rpc('exec_sql', {
    sql: sql,
  });

  if (execError) {
    throw new Error(`Migration failed: ${execError.message}`);
  }

  // Record migration
  const { error: recordError } = await supabase
    .from('migrations')
    .insert({ name: migration.name });

  if (recordError) {
    throw new Error(`Failed to record migration: ${recordError.message}`);
  }

  success(`Migration completed: ${migration.name}`);
};

// Run migrations
const runMigrations = async (dryRun = false) => {
  log('\n🗄️  Database Migration Script', 'cyan');
  log('================================\n', 'cyan');

  // Initialize Supabase
  const supabase = initSupabase();

  try {
    // Create migrations table
    info('Checking migrations table...');
    await createMigrationsTable(supabase);
    success('Migrations table ready');

    // Get all migrations
    const allMigrations = getMigrationFiles();
    info(`Found ${allMigrations.length} migration files`);

    if (allMigrations.length === 0) {
      warning('No migrations found');
      return;
    }

    // Get executed migrations
    const executedMigrations = await getExecutedMigrations(supabase);
    info(`${executedMigrations.length} migrations already executed`);

    // Find pending migrations
    const pendingMigrations = allMigrations.filter(
      (migration) => !executedMigrations.includes(migration.name)
    );

    if (pendingMigrations.length === 0) {
      success('\n✅ Database is up to date');
      return;
    }

    log(`\n📋 Pending migrations (${pendingMigrations.length}):`, 'cyan');
    pendingMigrations.forEach((migration, index) => {
      log(`  ${index + 1}. ${migration.name}`);
    });

    if (dryRun) {
      warning('\n🔍 Dry run mode - no migrations executed');
      return;
    }

    // Execute pending migrations
    log('\n🚀 Executing migrations...', 'cyan');

    for (const migration of pendingMigrations) {
      await executeMigration(supabase, migration);
    }

    success('\n🎉 All migrations completed successfully!');
  } catch (err) {
    error(`\n❌ Migration failed: ${err.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  if (dryRun) {
    warning('Running in dry-run mode');
  }

  await runMigrations(dryRun);
};

// Run migrations
main().catch((err) => {
  error(`\n❌ Migration script failed: ${err.message}`);
  process.exit(1);
});
