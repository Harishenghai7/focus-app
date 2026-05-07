/**
 * SOVEREIGN HEARTBEAT: Notification Dispatcher Edge Function
 * Handles FCM push notifications and Web Push delivery
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

interface NotificationPayload {
  notification_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  require_interaction?: boolean;
}

interface FCMMessage {
  message: {
    token: string;
    notification: {
      title: string;
      body: string;
      image?: string;
    };
    webpush?: {
      headers?: Record<string, string>;
      notification?: {
        icon?: string;
        badge?: string;
        tag?: string;
        requireInteraction?: boolean;
        actions?: Array<{ action: string; title: string }>;
      };
      fcm_options?: {
        link?: string;
      };
    };
    data?: Record<string, string>;
    android?: {
      notification: {
        icon?: string;
        color?: string;
        sound?: string;
        channel_id?: string;
      };
    };
    apns?: {
      payload: {
        aps: {
          sound?: string;
          badge?: number;
        };
      };
    };
  };
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Send FCM notification
 */
async function sendFCMNotification(token: string, payload: NotificationPayload): Promise<boolean> {
  if (!fcmServerKey) {
    console.warn('FCM_SERVER_KEY not configured, skipping FCM');
    return false;
  }

  const fcmMessage: FCMMessage = {
    message: {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
        image: payload.icon,
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          icon: payload.icon || '/logo192.png',
          badge: payload.badge || '/badge-72x72.png',
          tag: payload.tag || payload.type,
          requireInteraction: payload.require_interaction || false,
        },
        fcm_options: {
          link: generateDeepLink(payload),
        },
      },
      data: {
        type: payload.type,
        notification_id: payload.notification_id,
        ...Object.entries(payload.data || {}).reduce((acc, [key, value]) => {
          acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
          return acc;
        }, {} as Record<string, string>),
      },
    },
  };

  try {
    const response = await fetch('https://fcm.googleapis.com/v1/projects/focus-app/messages:send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fcmMessage),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('FCM send failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('FCM send error:', error);
    return false;
  }
}

/**
 * Generate deep link for notification
 */
function generateDeepLink(payload: NotificationPayload): string {
  const baseUrl = 'https://focus.app';
  const data = payload.data || {};

  switch (payload.type) {
    case 'like':
    case 'comment':
    case 'mention':
      if (data.content_type === 'boltz') {
        return `${baseUrl}/boltz/${data.content_id}`;
      }
      return `${baseUrl}/p/${data.content_id}`;

    case 'follow':
      return `${baseUrl}/profile/${data.actor_username || data.actor_id}`;

    case 'message':
      return `${baseUrl}/messages/${data.conversation_id}`;

    case 'badge_granted':
    case 'verification_approved':
    case 'trust_level_up':
      return `${baseUrl}/verification-center`;

    case 'security_alert':
    case 'login_new_device':
      return `${baseUrl}/settings/security`;

    default:
      return `${baseUrl}/notifications`;
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

  // If more than 1 notification of same type on same content, batch them
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

  // Get user settings and FCM tokens
  const { data: userSettings, error: settingsError } = await supabase
    .from('user_settings')
    .select('push_notifications_enabled, fcm_token, notification_settings')
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

  // Get actor info
  let actorName = 'Someone';
  if (notification.actor_id) {
    const { data: actor } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url')
      .eq('id', notification.actor_id)
      .single();

    if (actor) {
      actorName = actor.full_name || actor.username || 'Someone';
    }
  }

  // Build notification payload
  const notificationPayload: NotificationPayload = {
    notification_id: notification.id,
    user_id: notification.user_id,
    type: notification.type,
    title: getNotificationTitle(notification.type, actorName),
    body: getNotificationBody(notification.type, notification.content, batchCount),
    icon: actor?.avatar_url || '/logo192.png',
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
    },
    require_interaction: ['call', 'security_alert', 'login_new_device'].includes(notification.type),
  };

  // Send FCM notification if token exists
  let fcmSent = false;
  if (userSettings.fcm_token) {
    fcmSent = await sendFCMNotification(userSettings.fcm_token, notificationPayload);
  }

  // Log dispatch result
  await supabase.from('notification_dispatch_logs').insert({
    notification_id: notification.id,
    user_id: notification.user_id,
    fcm_sent: fcmSent,
    fcm_token_present: !!userSettings.fcm_token,
    created_at: new Date().toISOString(),
  });

  return {
    success: true,
    fcm_sent: fcmSent,
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
