// TEMPORARY TEST: Minimal message send function
// Add this to ChatPane.js temporarily to test if the database works

const testSendMessage = async () => {
    try {
        console.log('🧪 TEST: Sending message directly...');

        const { data, error } = await supabase
            .from('messages')
            .insert({
                sender_id: '7bf2ce9c-5c9f-408b-bf97-462de4583ac6',
                conversation_id: 'c27b67d7-5778-4ed0-b837-8276200bd8df',
                content: 'Test message',
                message_type: 'text'
            })
            .select()
            .single();

        if (error) {
            console.error('🧪 TEST ERROR:', error);
        } else {
            console.log('🧪 TEST SUCCESS:', data);
        }
    } catch (err) {
        console.error('🧪 TEST EXCEPTION:', err);
    }
};

// Call this in the browser console:
// testSendMessage()
