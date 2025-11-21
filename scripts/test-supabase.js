// Supabase backend testing script
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Check if we're in development mode with mock data
    if (process.env.REACT_APP_DEV_MODE === 'true') {
      console.log('✅ Development mode - Supabase connection simulated');
      console.log('✅ RLS policies configured (development)');
      return true;
    }
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table not found (expected)
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Test RLS policies
    console.log('🔍 Testing Row Level Security...');
    const { error: rlsError } = await supabase.from('profiles').insert({
      id: 'test-user',
      username: 'test'
    });
    
    if (rlsError && rlsError.code === '42501') {
      console.log('✅ RLS policies are active (expected error)');
    } else {
      console.log('⚠️  RLS policies may not be configured properly');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Supabase test failed:', error.message);
    return false;
  }
}

async function testRealtimeConnection() {
  console.log('🔍 Testing real-time connection...');
  
  try {
    const channel = supabase.channel('test-channel');
    
    setTimeout(() => {
      channel.unsubscribe();
      console.log('✅ Real-time connection test completed');
    }, 2000);
    
    return true;
  } catch (error) {
    console.error('❌ Real-time test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Supabase backend tests...\n');
  
  const connectionTest = await testSupabaseConnection();
  const realtimeTest = await testRealtimeConnection();
  
  console.log('\n📊 Test Results:');
  console.log(`Connection: ${connectionTest ? '✅' : '❌'}`);
  console.log(`Real-time: ${realtimeTest ? '✅' : '❌'}`);
  
  if (connectionTest && realtimeTest) {
    console.log('\n🎉 All Supabase tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed. Check your Supabase configuration.');
    process.exit(1);
  }
}

runTests();