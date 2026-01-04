import { supabase } from './lib/supabase';

// DIRECT TEST - Run this in browser console
window.testDirectSend = async () => {
    console.log('🧪 DIRECT TEST: Sending message...');

    try {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                sender_id: '7bf2ce9c-5c9f-408b-bf97-462de4583ac6',
                conversation_id: 'c27b67d7-5778-4ed0-b837-8276200bd8df',
                content: 'Direct test message at ' + new Date().toISOString(),
                message_type: 'text'
            })
            .select()
            .single();

        if (error) {
            console.error('🧪 ERROR:', error);
            return { success: false, error };
        }

        console.log('🧪 SUCCESS:', data);
        return { success: true, data };
    } catch (err) {
        console.error('🧪 EXCEPTION:', err);
        return { success: false, error: err };
    }
};

console.log('✅ Test function loaded. Run: testDirectSend()');
