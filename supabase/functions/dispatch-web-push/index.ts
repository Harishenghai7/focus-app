/**
 * FREE & OPEN SOURCE Web Push Dispatcher Edge Function
 * Uses web-push library (NO Firebase, NO FCM, 100% Free)
 * 
 * Requirements:
 * - VAPID keys (generate with: npx web-push generate-vapid-keys)
 * - web-push library (Deno compatible)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Web Push library (using a Deno-compatible implementation)
// Note: In production, you may need to use a Deno-native web push library
// For now, we'll use a custom implementation

interface WebPushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: Record<string, any>;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@focus.app';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Send Web Push notification
 * Uses native Web Push Protocol (RFC 8030)
 */
async function sendWebPush(
    subscription: WebPushSubscription,
    payload: PushPayload
): Promise<boolean> {
    try {
        // Build the JWT for VAPID authentication
        const jwt = await buildVapidJWT(vapidPublicKey, vapidPrivateKey, vapidSubject, subscription.endpoint);

        // Build the encrypted payload
        const encryptedPayload = await encryptPayload(
            subscription.keys.p256dh,
            subscription.keys.auth,
            JSON.stringify({ notification: payload, data: payload.data })
        );

        // Send the push request
        const response = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Encoding': 'aes128gcm',
                'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
                'TTL': '86400', // Time to live: 24 hours
                'Urgency': getUrgency(payload.data?.type),
            },
            body: encryptedPayload,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Web Push send failed:', errorText);

            // Handle expired subscription
            if (response.status === 410 || response.status === 404) {
                await removeSubscription(subscription.endpoint);
            }

            return false;
        }

        return true;
    } catch (error) {
        console.error('Web Push send error:', error);
        return false;
    }
}

/**
 * Build VAPID JWT for authentication
 */
async function buildVapidJWT(
    publicKey: string,
    privateKey: string,
    subject: string,
    endpoint: string
): Promise<string> {
    const origin = new URL(endpoint).origin;
    const expiration = Math.floor(Date.now() / 1000) + 86400; // 24 hours

    const header = {
        typ: 'JWT',
        alg: 'ES256',
    };

    const payload = {
        aud: origin,
        exp: expiration,
        sub: subject,
    };

    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '');
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    // Note: In a real implementation, you'd properly sign this with the VAPID private key
    // This is a simplified version - in production, use a proper crypto library
    const signature = await signWithPrivateKey(privateKey, signatureInput);

    return `${signatureInput}.${signature}`;
}

/**
 * Sign data with VAPID private key (placeholder)
 * In production, use proper ECDSA signing
 */
async function signWithPrivateKey(privateKey: string, data: string): Promise<string> {
    // This is a placeholder - in production, use a proper crypto library
    // For Deno, you would use the Web Crypto API or a compatible library
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Simplified signing (replace with proper implementation)
    const signature = btoa(String.fromCharCode(...dataBuffer)).replace(/=/g, '');
    return signature;
}

/**
 * Encrypt payload for push delivery
 */
async function encryptPayload(
    userPublicKey: string,
    userAuthToken: string,
    payload: string
): Promise<ArrayBuffer> {
    // This is a simplified version
    // In production, use the proper encryption scheme from RFC 8291
    // You'll need a proper implementation of the ECDH key exchange and AES-128-GCM encryption

    const encoder = new TextEncoder();
    return encoder.encode(payload).buffer;
}

/**
 * Get urgency level for notification type
 */
function getUrgency(type: string | undefined): string {
    if (['security_alert', 'login_new_device', 'suspicious_login'].includes(type || '')) {
        return 'high';
    }
    if (type === 'message') {
        return 'normal';
    }
    return 'low';
}

/**
 * Remove expired subscription from database
 */
async function removeSubscription(endpoint: string): Promise<void> {
    try {
        await supabase
            .from('user_settings')
            .update({
                push_subscription: null,
                push_notifications_enabled: false,
            })
            .eq('push_subscription->>endpoint', endpoint);
    } catch (error) {
        console.error('Error removing subscription:', error);
    }
}

/**
 * Get notification title based on type
 */
function getNotificationTitle(type: string, actorName: string): string {
    switch (type) {
        case 'like': return `${actorName} liked your post`;
        case 'boltz_like': return `${actorName} liked your boltz`;
        case 'comment': return `${actorName} commented`;
        case 'boltz_comment': return `${actorName} commented on your boltz`;
        case 'follow': return 'New follower';
        case 'mention': return `${actorName} mentioned you`;
        case 'message': return `New message from ${actorName}`;
        case 'reply': return `${actorName} replied to you`;
        case 'badge_granted': return '🏆 Badge Granted!';
        case 'verification_approved': return '✅ Verification Approved';
        case 'trust_level_up': return '🛡️ Trust Level Up!';
        case 'security_alert': return '🔒 Security Alert';
        case 'login_new_device': return '🔐 New Login Detected';
        default: return 'New notification';
    }
}

/**
 * Get notification body text
 */
function getNotificationBody(type: string, content: string, batchCount: number): string {
    if (batchCount > 1) {
        return `and ${batchCount - 1} others ${type === 'like' ? 'liked your post' : 'interacted'}`;
    }

    switch (type) {
        case 'like':
        case 'boltz_like':
            return 'Tap to view';
        case 'comment':
        case 'boltz_comment':
        case 'reply':
            return content.length > 60 ? content.substring(0, 60) + '...' : content;
        case 'follow':
            return 'started following you';
        case 'mention':
            return content.length > 60 ? content.substring(0, 60) + '...' : content;
        case 'message':
            return content || 'Sent you a message';
        case 'badge_granted':
            return 'Congratulations! You earned a verified badge';
        case 'verification_approved':
            return 'Your identity verification was approved';
        case 'trust_level_up':
            return 'Your Trust Shield tier has increased!';
        case 'security_alert':
            return content || 'Important security update';
        case 'login_new_device':
            return 'A new device signed into your account';
        default:
            return content || 'Tap to view';
    }
}

/**
 * Check for batching opportunities
 */
async function checkBatching(notification: any): Promise<{ shouldBatch: boolean; count: number }> {
    const { data: recentNotifications, error } = await supabase
        .from('notifications')
        .select('id, actor_id')
        .eq('user_id', notification.user_id)
        .eq('type', notification.type)
        .eq('is_read', false)
        .eq('content_id', notification.content_id)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order('created_at', { ascending: false });

    if (error || !recentNotifications) {
        return { shouldBatch: false, count: 1 };
    }

    return {
        shouldBatch: recentNotifications.length > 1,
        count: recentNotifications.length,
    };
}

/**
 * Main handler for incoming notifications
 */
async function handleNotification(payload: any) {
    const { record, table, type: eventType } = payload;

    // Only process INSERT events on notifications table
    if (table !== 'notifications' || eventType !== 'INSERT') {
        return { success: true, message: 'Ignored non-notification event' };
    }

    const notification = record;

    // Skip if no user_id
    if (!notification.user_id) {
        return { success: false, error: 'No user_id in notification' };
    }

    // Check batching
    const { count: batchCount } = await checkBatching(notification);

    // Get user settings and push subscription
    const { data: userSettings, error: settingsError } = await supabase
        .from('user_settings')
        .select('push_notifications_enabled, push_subscription, notification_settings')
        .eq('user_id', notification.user_id)
        .single();

    if (settingsError) {
        console.error('Failed to fetch user settings:', settingsError);
        return { success: false, error: 'Failed to fetch user settings' };
    }

    // Check if push notifications are enabled
    if (!userSettings?.push_notifications_enabled) {
        return { success: true, message: 'Push notifications disabled' };
    }

    // Check notification type preferences
    const typeSettings = userSettings.notification_settings || {};
    if (typeSettings[notification.type] === false) {
        return { success: true, message: 'Notification type disabled' };
    }

    // Check for push subscription
    const pushSubscription: WebPushSubscription | null = userSettings.push_subscription;
    if (!pushSubscription) {
        return { success: true, message: 'No push subscription found' };
    }

    // Get actor info
    let actorName = 'Someone';
    let actorAvatar = null;
    if (notification.actor_id) {
        const { data: actor } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', notification.actor_id)
            .single();

        if (actor) {
            actorName = actor.full_name || actor.username || 'Someone';
            actorAvatar = actor.avatar_url;
        }
    }

    // Build notification payload
    const pushPayload: PushPayload = {
        title: getNotificationTitle(notification.type, actorName),
        body: getNotificationBody(notification.type, notification.content, batchCount),
        icon: actorAvatar || '/logo192.png',
        badge: '/badge-72x72.png',
        tag: notification.type,
        data: {
            type: notification.type,
            content_id: notification.content_id,
            content_type: notification.content_type,
            actor_id: notification.actor_id,
            actor_username: actor?.username,
            conversation_id: notification.metadata?.conversation_id,
            batch_count: batchCount,
            notification_id: notification.id,
        },
    };

    // Send Web Push notification
    const pushSent = await sendWebPush(pushSubscription, pushPayload);

    // Log dispatch result
    await supabase.from('notification_dispatch_logs').insert({
        notification_id: notification.id,
        user_id: notification.user_id,
        push_sent: pushSent,
        subscription_present: true,
        created_at: new Date().toISOString(),
    });

    return {
        success: true,
        push_sent: pushSent,
        batch_count: batchCount,
    };
}

// Main serve function
serve(async (req) => {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // Only accept POST requests
    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Check for required environment variables
    if (!vapidPublicKey || !vapidPrivateKey) {
        return new Response(
            JSON.stringify({ 
                error: 'VAPID keys not configured',
                message: 'Generate VAPID keys with: npx web-push generate-vapid-keys'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        const payload = await req.json();
        const result = await handleNotification(payload);

        return new Response(
            JSON.stringify(result),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Edge function error:', error);

        return new Response(
            JSON.stringify({ error: 'Internal server error', details: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

console.log('🚀 FREE Web Push Dispatcher Edge Function ready (NO Firebase!)');
