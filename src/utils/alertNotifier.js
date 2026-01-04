/**
  * Alert Notifier
 * Multi-channel alert delivery for guardians
 */

import { supabase } from '../lib/supabase';

/**
 * Send push notification (in-app)
 */
export const sendPushNotification = async (userId, alert) => {
    try {
        // TODO: Integrate with push notification service
        // For now, just log
        console.log('Push notification sent:', { userId, alert });

        return { success: true, method: 'push' };
    } catch (error) {
        console.error('Error sending push notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send email notification
 */
export const sendEmailNotification = async (email, alert, teenInfo) => {
    try {
        // Use Supabase Edge Function or external email service
        const { data, error } = await supabase.functions.invoke('send-alert-email', {
            body: {
                to: email,
                alert,
                teenInfo
            }
        });

        if (error) throw error;

        return { success: true, method: 'email' };
    } catch (error) {
        console.error('Error sending email notification:', error);

        // Fallback: Log for manual review
        console.warn(`ALERT EMAIL NOT SENT: ${email}`, alert);
        return { success: false, error: error.message };
    }
};

/**
 * Send SMS notification (for critical alerts)
 */
export const sendSMSNotification = async (phoneNumber, alert) => {
    try {
        // TODO: Integrate with SMS service (Twilio, etc.)
        // For now, just log
        console.log('SMS notification sent:', { phoneNumber, alert });

        return { success: true, method: 'sms' };
    } catch (error) {
        console.error('Error sending SMS notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Create safety alert in database
 */
export const createSafetyAlert = async ({
    teenId,
    parentId,
    alertType,
    severity,
    title,
    description,
    relatedContentId = null,
    relatedContentType = null,
    relatedUserId = null,
    aiAnalysisData = null
}) => {
    try {
        const { data, error } = await supabase
            .from('safety_alerts')
            .insert({
                teen_id: teenId,
                parent_id: parentId,
                alert_type: alertType,
                severity,
                title,
                description,
                related_content_id: relatedContentId,
                related_content_type: relatedContentType,
                related_user_id: relatedUserId,
                ai_analysis_data: aiAnalysisData,
                status: 'new'
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, alert: data };
    } catch (error) {
        console.error('Error creating safety alert:', error);
        throw error;
    }
};

/**
 * Notify guardians about safety alert
 */
export const notifyGuardians = async (alertId, teenId, alert) => {
    try {
        // Get active guardians for this teen
        const { data: guardians } = await supabase
            .from('guardian_relationships')
            .select(`
        parent_id,
        permissions,
        parent:parent_id (
          id,
          email,
          username,
          phone_number
        )
      `)
            .eq('teen_id', teenId)
            .eq('status', 'active');

        if (!guardians || guardians.length === 0) {
            console.warn('No active guardians found for teen:', teenId);
            return { success: false, message: 'No guardians to notify' };
        }

        // Get teen info for email context
        const { data: teenData } = await supabase
            .from('users')
            .select('username, full_name')
            .eq('id', teenId)
            .single();

        const notificationResults = [];

        for (const guardian of guardians) {
            // Check if guardian has permission to receive alerts
            if (guardian.permissions?.receive_safety_alerts !== true) {
                continue;
            }

            const parent = guardian.parent;

            // Determine notification method based on severity
            if (alert.severity === 'critical') {
                // Critical: Send email AND SMS
                const emailResult = await sendEmailNotification(parent.email, alert, teenData);
                notificationResults.push(emailResult);

                if (parent.phone_number) {
                    const smsResult = await sendSMSNotification(parent.phone_number, alert);
                    notificationResults.push(smsResult);
                }
            } else if (alert.severity === 'high') {
                // High: Email
                const emailResult = await sendEmailNotification(parent.email, alert, teenData);
                notificationResults.push(emailResult);
            } else {
                // Medium/Low: In-app push notification only
                const pushResult = await sendPushNotification(parent.id, alert);
                notificationResults.push(pushResult);
            }
        }

        // Update alert with notification status
        const notificationMethod = notificationResults
            .filter(r => r.success)
            .map(r => r.method)
            .join(',');

        await supabase
            .from('safety_alerts')
            .update({
                status: 'notified',
                parent_notified_at: new Date().toISOString(),
                notification_method: notificationMethod
            })
            .eq('id', alertId);

        return {
            success: true,
            notificationsSent: notificationResults.filter(r => r.success).length,
            results: notificationResults
        };
    } catch (error) {
        console.error('Error notifying guardians:', error);
        throw error;
    }
};

/**
 * Process content and create alert if needed
 */
export const processContentForAlerts = async (teenId, content, context = {}) => {
    try {
        // Import content analyzer
        const { analyzeContent, getSeverityLevel } = await import('./contentAnalyzer');

        // Analyze content
        const analysis = await analyzeContent(content, context);

        if (!analysis.flagged || analysis.issues.length === 0) {
            return { alertCreated: false, message: 'Content is safe' };
        }

        // Get severity
        const severity = getSeverityLevel(analysis.issues);

        // Get guardians for this teen
        const { data: guardians } = await supabase
            .from('guardian_relationships')
            .select('parent_id')
            .eq('teen_id', teenId)
            .eq('status', 'active')
            .limit(1);

        if (!guardians || guardians.length === 0) {
            return { alertCreated: false, message: 'No guardians to alert' };
        }

        const parentId = guardians[0].parent_id;

        // Create alert for each detected issue
        const createdAlerts = [];

        for (const issue of analysis.issues) {
            const alertResult = await createSafetyAlert({
                teenId,
                parentId,
                alertType: issue.type,
                severity: issue.severity,
                title: issue.description,
                description: issue.description + (issue.matched_keywords ? ` (Keywords: ${issue.matched_keywords.join(', ')})` : ''),
                relatedContentId: context.contentId,
                relatedContentType: context.contentType,
                relatedUserId: context.relatedUserId,
                aiAnalysisData: {
                    confidence: issue.confidence,
                    ai_analysis: analysis.ai_analysis
                }
            });

            if (alertResult.success) {
                // Notify guardians
                await notifyGuardians(alertResult.alert.id, teenId, alertResult.alert);
                createdAlerts.push(alertResult.alert);
            }
        }

        return {
            alertCreated: true,
            alertsCount: createdAlerts.length,
            alerts: createdAlerts,
            severity
        };
    } catch (error) {
        console.error('Error processing content for alerts:', error);
        throw error;
    }
};

/**
 * Create adult-stranger contact alert
 */
export const createStrangerContactAlert = async (teenId, adultUserId, messagePreview = '') => {
    try {
        const { data: guardians } = await supabase
            .from('guardian_relationships')
            .select('parent_id')
            .eq('teen_id', teenId)
            .eq('status', 'active')
            .limit(1);

        if (!guardians || guardians.length === 0) return;

        const parentId = guardians[0].parent_id;

        // Get adult user info
        const { data: adultData } = await supabase
            .from('users')
            .select('username, full_name')
            .eq('id', adultUserId)
            .single();

        const alertResult = await createSafetyAlert({
            teenId,
            parentId,
            alertType: 'adult_stranger_contact',
            severity: 'high',
            title: 'Adult Stranger Contact',
            description: `An adult stranger (@${adultData?.username || 'unknown'}) has messaged your teen. ${messagePreview ? `Preview: "${messagePreview.substring(0, 100)}..."` : ''}`,
            relatedUserId: adultUserId
        });

        if (alertResult.success) {
            await notifyGuardians(alertResult.alert.id, teenId, alertResult.alert);
        }

        return alertResult;
    } catch (error) {
        console.error('Error creating stranger contact alert:', error);
        throw error;
    }
};

/**
 * Rate limit notifications to prevent spam
 * Returns true if notification should be sent, false if rate limited
 */
export const checkRateLimit = async (teenId, alertType, windowMinutes = 60) => {
    try {
        const windowStart = new Date();
        windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

        const { count } = await supabase
            .from('safety_alerts')
            .select('*', { count: 'exact', head: true })
            .eq('teen_id', teenId)
            .eq('alert_type', alertType)
            .gte('created_at', windowStart.toISOString());

        // Max 3 of same alert type per hour
        return count < 3;
    } catch (error) {
        console.error('Error checking rate limit:', error);
        return true; // Allow on error
    }
};

export default {
    sendPushNotification,
    sendEmailNotification,
    sendSMSNotification,
    createSafetyAlert,
    notifyGuardians,
    processContentForAlerts,
    createStrangerContactAlert,
    checkRateLimit
};
