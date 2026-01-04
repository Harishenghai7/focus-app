// ALTERNATIVE: Direct REST API Implementation
// Use this if Supabase client keeps hanging

import { supabaseUrl, supabaseAnonKey } from './supabase';

// Fetch users using direct REST API
export const fetchUsersDirectly = async (userId, searchQuery = '') => {
    try {
        console.log('🌐 Using direct REST API...');

        let url = `${supabaseUrl}/rest/v1/profiles?select=id,username,full_name,avatar_url,verified&id=neq.${userId}&limit=20`;

        if (searchQuery.trim()) {
            url += `&or=(username.ilike.*${searchQuery}*,full_name.ilike.*${searchQuery}*)`;
        }

        console.log('📡 Fetching:', url);

        const response = await fetch(url, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        });

        console.log('📬 Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Got data:', data);

        return { data, error: null };
    } catch (error) {
        console.error('❌ Fetch error:', error);
        return { data: null, error };
    }
};

// Insert flash using direct REST API
export const insertFlashDirectly = async (userId, mediaPath, mediaType) => {
    try {
        console.log('🌐 Using direct REST API for flash...');

        const url = `${supabaseUrl}/rest/v1/flash`;

        // Use ACTUAL column names from database
        const insertData = {
            user_id: userId,
            media_url: mediaPath,       // ✅ Actual column name is media_url
            media_type: mediaType,      // ✅ Correct
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        console.log('📝 Inserting:', insertData);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(insertData)
        });

        console.log('📬 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Flash created:', data);

        return { data, error: null };
    } catch (error) {
        console.error('❌ Insert error:', error);
        return { data: null, error };
    }
};

// Send message using direct REST API
export const sendMessageDirectly = async (conversationId, senderId, text) => {
    try {
        console.log('💬 Sending message via REST API...');

        const url = `${supabaseUrl}/rest/v1/messages`;

        const messageData = {
            conversation_id: conversationId,
            sender_id: senderId,
            content: text,          // ✅ Actual column name is 'content'
            message_type: 'text'
        };

        console.log('📝 Message data:', messageData);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(messageData)
        });

        console.log('📬 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Message sent:', data);

        return { data, error: null };
    } catch (error) {
        console.error('❌ Message error:', error);
        return { data: null, error };
    }
};

// Create conversation using direct REST API
export const createConversationDirectly = async () => {
    try {
        console.log('💬 Creating conversation via REST API...');

        const url = `${supabaseUrl}/rest/v1/conversations`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({})
        });

        console.log('📬 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Conversation created:', data);

        return { data: data[0], error: null };
    } catch (error) {
        console.error('❌ Conversation error:', error);
        return { data: null, error };
    }
};
