/**
 * Linkified Text Utilities
 * 
 * Converts plain text into linkified text with mentions, hashtags, and URLs
 */

// Regular expressions for different types of links
const URL_REGEX = /(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?/gi;
const EMAIL_REGEX = /[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,4}/g;
const PHONE_REGEX = /(\+\d{1,3}[- ]?)?\d{10}/g;
const MENTION_REGEX = /@(\w+)/g;
const HASHTAG_REGEX = /#(\w+)/g;

/**
 * Convert URLs to clickable links
 * @param {string} text - Text containing URLs
 * @returns {string} Text with clickable URLs
 */
export const linkifyUrls = (text) => {
  return text.replace(URL_REGEX, (url) => {
    const href = url.startsWith('http') ? url : `http://${url}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
};

/**
 * Convert email addresses to clickable mailto links
 * @param {string} text - Text containing email addresses
 * @returns {string} Text with clickable email links
 */
export const linkifyEmails = (text) => {
  return text.replace(EMAIL_REGEX, (email) => {
    return `<a href="mailto:${email}">${email}</a>`;
  });
};

/**
 * Convert phone numbers to clickable tel links
 * @param {string} text - Text containing phone numbers
 * @returns {string} Text with clickable phone links
 */
export const linkifyPhones = (text) => {
  return text.replace(PHONE_REGEX, (phone) => {
    const cleanPhone = phone.replace(/[^+\d]/g, '');
    return `<a href="tel:${cleanPhone}">${phone}</a>`;
  });
};

/**
 * Convert @mentions to clickable profile links
 * @param {string} text - Text containing mentions
 * @returns {string} Text with clickable mention links
 */
export const linkifyMentions = (text) => {
  return text.replace(MENTION_REGEX, (match, username) => {
    return `<a href="/profile/${username}" class="mention" data-username="${username}">@${username}</a>`;
  });
};

/**
 * Convert #hashtags to clickable hashtag links
 * @param {string} text - Text containing hashtags
 * @returns {string} Text with clickable hashtag links
 */
export const linkifyHashtags = (text) => {
  return text.replace(HASHTAG_REGEX, (match, hashtag) => {
    return `<a href="/hashtag/${hashtag}" class="hashtag" data-hashtag="${hashtag}">#${hashtag}</a>`;
  });
};

/**
 * Extract mentions from text
 * @param {string} text - Text containing mentions
 * @returns {string[]} Array of usernames mentioned
 */
export const extractMentions = (text) => {
  const matches = text.match(MENTION_REGEX);
  return matches ? matches.map(match => match.slice(1)) : [];
};

/**
 * Extract hashtags from text
 * @param {string} text - Text containing hashtags
 * @returns {string[]} Array of hashtags
 */
export const extractHashtags = (text) => {
  const matches = text.match(HASHTAG_REGEX);
  return matches ? matches.map(match => match.slice(1)) : [];
};

/**
 * Convert text to fully linkified version (all types)
 * @param {string} text - Plain text
 * @param {Object} options - Linkification options
 * @returns {string} Fully linkified text
 */
export const linkifyAll = (text, options = {}) => {
  const {
    urls = true,
    emails = true,
    phones = true,
    mentions = true,
    hashtags = true
  } = options;

  let result = text;

  if (urls) result = linkifyUrls(result);
  if (emails) result = linkifyEmails(result);
  if (phones) result = linkifyPhones(result);
  if (mentions) result = linkifyMentions(result);
  if (hashtags) result = linkifyHashtags(result);

  return result;
};

/**
 * Strip all links from text (return plain text)
 * @param {string} linkifiedText - Text with links
 * @returns {string} Plain text without links
 */
export const stripLinks = (linkifiedText) => {
  return linkifiedText
    .replace(/<a[^>]*>([^<]+)<\/a>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

/**
 * Get link preview data for a URL
 * @param {string} url - URL to get preview for
 * @returns {Object} Link preview data
 */
export const getLinkPreview = async (url) => {
  try {
    // This would typically call a backend service
    // For now, return basic URL parsing
    const urlObj = new URL(url);
    return {
      url,
      domain: urlObj.hostname,
      title: urlObj.hostname,
      description: `Link to ${urlObj.hostname}`,
      image: null
    };
  } catch (error) {
    return null;
  }
};

export default {
  linkifyUrls,
  linkifyEmails,
  linkifyPhones,
  linkifyMentions,
  linkifyHashtags,
  extractMentions,
  extractHashtags,
  linkifyAll,
  stripLinks,
  getLinkPreview
};
