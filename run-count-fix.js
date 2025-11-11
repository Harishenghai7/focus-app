const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read the SQL file
const sqlFile = path.join(__dirname, 'fix-interaction-counts.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'https://wggnjfcayfvyritpojaj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZ25qZmNheWZ2eXJpdHBvamFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MjQ3NDUsImV4cCI6MjA3NTUwMDc0NX0.cqToCy5S_tbrnmm8r9On2FEcVwEWynhgwYFo0AquzgY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runCountFix() {
  try {
    console.log('Running interaction count fix...');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error running SQL:', error);
    } else {
      console.log('✅ Interaction count system fixed successfully!');
      console.log('- Database triggers created for automatic count updates');
      console.log('- Existing counts recalculated');
      console.log('- Real-time updates enabled');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Uncomment the line below and add your Supabase credentials to run
// runCountFix();

console.log('To run this fix:');
console.log('1. Add your Supabase URL and key to this file');
console.log('2. Uncomment the runCountFix() call');
console.log('3. Run: node run-count-fix.js');
console.log('');
console.log('Or manually run the SQL in fix-interaction-counts.sql in your Supabase dashboard');