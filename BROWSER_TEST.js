/**
 * ═══════════════════════════════════════════════════════════════════════
 * BROWSER CONSOLE TEST SCRIPT
 * Copy and paste this into your browser console (F12) to test if
 * the New Message search will work
 * ═══════════════════════════════════════════════════════════════════════
 */

console.log('🧪 Starting New Message Search Test...\n');

// Test 1: Check if Supabase is available
if (typeof supabase === 'undefined') {
    console.error('❌ Supabase client not found!');
    console.log('💡 Make sure you\'re on the Messages page');
} else {
    console.log('✅ Supabase client found');
}

// Test 2: Fetch profiles
async function testProfilesFetch() {
    console.log('\n📋 Test 2: Fetching profiles...');
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .limit(5);
        
        if (error) {
            console.error('❌ Error fetching profiles:', error);
            console.log('💡 This is why "No User Found" appears!');
            console.log('💡 Error code:', error.code);
            console.log('💡 Error message:', error.message);
            
            if (error.code === '42501') {
                console.log('\n🔧 FIX: RLS policy is blocking access');
                console.log('   Run EMERGENCY_FIX_RLS.sql in Supabase');
            }
        } else if (!data || data.length === 0) {
            console.warn('⚠️  No profiles found in database');
            console.log('💡 Database is empty!');
            console.log('🔧 FIX: Run CREATE_TEST_USERS.sql in Supabase');
        } else {
            console.log('✅ Successfully fetched profiles:', data.length);
            console.table(data);
            console.log('\n🎉 New Message search should work!');
        }
    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

// Test 3: Test search query
async function testSearchQuery(searchTerm = 'test') {
    console.log(`\n🔍 Test 3: Testing search for "${searchTerm}"...`);
    
    try {
        const searchPattern = `%${searchTerm}%`;
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .or(`username.ilike.${searchPattern},full_name.ilike.${searchPattern}`)
            .limit(10);
        
        if (error) {
            console.error('❌ Search query failed:', error);
        } else {
            console.log(`✅ Found ${data.length} users matching "${searchTerm}"`);
            if (data.length > 0) {
                console.table(data);
            }
        }
    } catch (err) {
        console.error('❌ Search error:', err);
    }
}

// Test 4: Check authentication
async function testAuth() {
    console.log('\n🔐 Test 4: Checking authentication...');
    
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('❌ Auth error:', error);
        } else if (!session) {
            console.warn('⚠️  Not authenticated!');
            console.log('💡 You need to be logged in');
        } else {
            console.log('✅ Authenticated as:', session.user.email);
            console.log('   User ID:', session.user.id);
        }
    } catch (err) {
        console.error('❌ Auth check failed:', err);
    }
}

// Run all tests
async function runAllTests() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 NEW MESSAGE SEARCH DIAGNOSTIC TEST');
    console.log('═══════════════════════════════════════════════════════\n');
    
    await testAuth();
    await testProfilesFetch();
    await testSearchQuery('tech');
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ DIAGNOSTIC COMPLETE');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nNext steps:');
    console.log('1. If you see errors above, run the SQL fixes in Supabase');
    console.log('2. Refresh the page and try again');
    console.log('3. Click "New Message" to test the actual feature');
}

// Auto-run if Supabase is available
if (typeof supabase !== 'undefined') {
    runAllTests();
} else {
    console.log('⚠️  Run this script on the Messages page where Supabase is loaded');
}
