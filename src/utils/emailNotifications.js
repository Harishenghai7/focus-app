// Email notification utilities using EmailJS
// Handles all email notifications for reports and support tickets via Gmail/Outlook
import emailjs from '@emailjs/browser';

/**
 * Initialize EmailJS
 * Note: Requires REACT_APP_EMAILJS_PUBLIC_KEY in environment variables
 */
const initEmailJS = () => {
  const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
  if (publicKey) {
    emailjs.init(publicKey);
  } else {
    console.warn('EmailJS Public Key not configured. Email notifications disabled.');
  }
};

// Initialize on load
initEmailJS();

/**
 * Send email using EmailJS
 * 
 * @param {Object} templateParams - Parameters to pass to the email template
 * @returns {Promise} - EmailJS response
 */
const sendEmail = async (templateParams) => {
  const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
  const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn('EmailJS environment variables missing.');
    return { success: false, error: 'Configuration missing' };
  }

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams);
    console.log('✅ Email sent successfully!', response.status, response.text);
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
};

/**
 * Send report confirmation email to reporter
 * @param {Object} report - Report object
 * @param {Object} user - User object
 */
export const sendReportConfirmation = async (report, user) => {
  // Map data to EmailJS template variables
  // Ensure your EmailJS template has these variables: {{to_name}}, {{to_email}}, {{subject}}, {{message_html}}
  const templateParams = {
    to_name: user.username || 'User',
    to_email: user.email,
    subject: 'Report Received - Focus Moderation',
    message_html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #B794F6;">Report Received</h2>
                <p>Hi ${user.username || 'there'},</p>
                <p>Thank you for reporting content on Focus. We take these reports seriously and our moderation team will review it shortly.</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Report ID:</strong> ${report.id}</p>
                    <p><strong>Category:</strong> ${report.category}</p>
                    <p><strong>Status:</strong> ${report.status}</p>
                </div>
                <p>You can track the status of your report in your settings.</p>
            </div>
        `
  };

  return sendEmail(templateParams);
};

/**
 * Send support ticket confirmation email
 * @param {Object} ticket - Ticket object
 * @param {Object} user - User object
 */
export const sendTicketConfirmation = async (ticket, user) => {
  const templateParams = {
    to_name: user.username || 'User',
    to_email: user.email,
    subject: `Support Ticket #${ticket.ticket_number} Created`,
    message_html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #B794F6;">Support Ticket Created</h2>
                <p>Hi ${user.username || 'there'},</p>
                <p>We've received your support request. Our team will get back to you as soon as possible.</p>
                <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #B794F6; margin: 20px 0;">
                    <p><strong>Ticket:</strong> #${ticket.ticket_number}</p>
                    <p><strong>Subject:</strong> ${ticket.subject}</p>
                    <p><strong>Priority:</strong> ${ticket.priority}</p>
                </div>
                <p>Our typical response time is 24 hours.</p>
            </div>
        `
  };

  return sendEmail(templateParams);
};

/**
 * Send ticket update notification
 * @param {Object} ticket - Ticket object
 * @param {Object} user - User object
 * @param {string} updateMessage - Update message from admin
 */
export const sendTicketUpdate = async (ticket, user, updateMessage) => {
  const templateParams = {
    to_name: user.username || 'User',
    to_email: user.email,
    subject: `Update on Ticket #${ticket.ticket_number}`,
    message_html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #B794F6;">Ticket Updated</h2>
                <p>Hi ${user.username || 'there'},</p>
                <p>Your support ticket has been updated by our team.</p>
                <div style="background: #fff; border: 1px solid #eee; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Update:</strong></p>
                    <p>${updateMessage}</p>
                </div>
                <p><strong>Status:</strong> ${ticket.status}</p>
            </div>
        `
  };

  return sendEmail(templateParams);
};

/**
 * Send admin action notification (warning, suspension, etc.)
 * @param {Object} report - Report object
 * @param {Object} user - Reported user object
 * @param {string} action - Admin action taken
 * @param {string} notes - Admin notes
 */
export const sendAdminActionNotification = async (report, user, action, notes) => {
  const actionMessages = {
    warning: 'You have received a warning',
    content_removed: 'Your content has been removed',
    suspended: 'Your account has been temporarily suspended',
    banned: 'Your account has been permanently banned'
  };

  const message = actionMessages[action] || 'Action taken on your account';

  const templateParams = {
    to_name: user.username || 'User',
    to_email: user.email,
    subject: `Important Notice: ${message}`,
    message_html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #FF6B6B;">${message}</h2>
                <p>Hi ${user.username || 'there'},</p>
                <div style="background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0;">
                    <p><strong>Reason:</strong> ${report.category}</p>
                    ${notes ? `<p><strong>Details:</strong> ${notes}</p>` : ''}
                </div>
                <p>This action was taken because your content violated our Community Guidelines.</p>
                <p>If you believe this is an error, please contact support.</p>
            </div>
        `
  };

  return sendEmail(templateParams);
};

export default {
  sendReportConfirmation,
  sendTicketConfirmation,
  sendTicketUpdate,
  sendAdminActionNotification
};
