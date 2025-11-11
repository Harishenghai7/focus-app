#!/usr/bin/env node

/**
 * Focus App Production Setup Script
 * Automates database setup and initial configuration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

if (!config.supabaseUrl || !config.supabaseKey) {
  console.error('❌ Missing environment variables:');
  console.error('   REACT_APP_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(config.supabaseUrl, config.supabaseKey);

async function setupDatabase() {
  console.log('🔧 Setting up Focus App database...');

  try {
    // Read SQL files
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'complete-schema.sql'), 'utf8');
    const triggersSQL = fs.readFileSync(path.join(__dirname, 'triggers-functions.sql'), 'utf8');

    console.log('📊 Creating database schema...');
    
    // Execute schema (split by semicolon and execute each statement)
    const schemaStatements = schemaSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of schemaStatements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() + ';' });
        if (error && !error.message.includes('already exists')) {
          console.warn('⚠️  Schema warning:', error.message);
        }
      }
    }

    console.log('⚡ Creating triggers and functions...');
    
    // Execute triggers
    const triggerStatements = triggersSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of triggerStatements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() + ';' });
        if (error && !error.message.includes('already exists')) {
          console.warn('⚠️  Trigger warning:', error.message);
        }
      }
    }

    console.log('🗂️  Creating storage buckets...');
    
    // Create storage buckets
    const buckets = ['posts', 'boltz', 'flash', 'chat_media', 'thumbnails'];
    for (const bucket of buckets) {
      const { error } = await supabase.storage.createBucket(bucket, { public: false });
      if (error && !error.message.includes('already exists')) {
        console.warn(`⚠️  Bucket ${bucket} warning:`, error.message);
      }
    }

    console.log('✅ Database setup completed successfully!');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Deploy Edge Functions: supabase functions deploy');
    console.log('   2. Configure Agora credentials');
    console.log('   3. Set up Firebase FCM');
    console.log('   4. Run: npm start');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

async function validateSetup() {
  console.log('🔍 Validating setup...');

  try {
    // Check if tables exist
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    const requiredTables = ['profiles', 'posts', 'boltz', 'flash', 'likes', 'comments', 'messages'];
    const existingTables = tables?.map(t => t.table_name) || [];
    
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.error('❌ Missing tables:', missingTables.join(', '));
      return false;
    }

    // Check RLS policies
    const { data: policies } = await supabase
      .from('pg_policies')
      .select('tablename, policyname')
      .in('tablename', requiredTables);

    if (!policies || policies.length === 0) {
      console.error('❌ No RLS policies found');
      return false;
    }

    // Check storage buckets
    const { data: buckets } = await supabase.storage.listBuckets();
    const requiredBuckets = ['posts', 'boltz', 'flash'];
    const existingBuckets = buckets?.map(b => b.name) || [];
    
    const missingBuckets = requiredBuckets.filter(bucket => !existingBuckets.includes(bucket));
    
    if (missingBuckets.length > 0) {
      console.error('❌ Missing storage buckets:', missingBuckets.join(', '));
      return false;
    }

    console.log('✅ Setup validation passed!');
    return true;

  } catch (error) {
    console.error('❌ Validation failed:', error);
    return false;
  }
}

async function main() {
  console.log('🎯 Focus App Production Setup');
  console.log('================================');

  const command = process.argv[2];

  switch (command) {
    case 'setup':
      await setupDatabase();
      break;
    case 'validate':
      const isValid = await validateSetup();
      process.exit(isValid ? 0 : 1);
      break;
    case 'reset':
      console.log('⚠️  This will delete all data. Type "yes" to continue:');
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      readline.question('> ', async (answer) => {
        if (answer === 'yes') {
          await setupDatabase();
        } else {
          console.log('❌ Reset cancelled');
        }
        readline.close();
      });
      break;
    default:
      console.log('Usage:');
      console.log('  node setup-production.js setup    - Set up database and storage');
      console.log('  node setup-production.js validate - Validate existing setup');
      console.log('  node setup-production.js reset    - Reset and recreate everything');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { setupDatabase, validateSetup };