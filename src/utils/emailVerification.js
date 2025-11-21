/**
 * Email Verification Utility
 * Analyzes email quality and detects disposable/suspicious emails
 */

// Common disposable email domains
const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'throwaway.email', '10minutemail.com', 'guerrillamail.com',
  'mailinator.com', 'maildrop.cc', 'temp-mail.org', 'yopmail.com',
  'trashmail.com', 'fakeinbox.com', 'getairmail.com', 'spambox.us'
];

// Role-based email prefixes
const ROLE_PREFIXES = [
  'admin', 'info', 'support', 'sales', 'noreply', 'no-reply',
  'postmaster', 'webmaster', 'abuse', 'contact', 'help'
];

/**
 * Analyze email quality and detect suspicious patterns
 * @param {string} email - Email address to analyze
 * @returns {Object} Analysis results
 */
export async function analyzeEmailQuality(email) {
  if (!email || typeof email !== 'string') {
    return {
      score: 0,
      isDisposable: false,
      isRoleAccount: false,
      isValid: false,
      domain: null
    };
  }

  const emailLower = email.toLowerCase().trim();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(emailLower);
  
  if (!isValid) {
    return {
      score: 0,
      isDisposable: false,
      isRoleAccount: false,
      isValid: false,
      domain: null
    };
  }

  const [localPart, domain] = emailLower.split('@');
  
  // Check if disposable domain
  const isDisposable = DISPOSABLE_DOMAINS.some(disposableDomain => 
    domain.includes(disposableDomain)
  );
  
  // Check if role-based account
  const isRoleAccount = ROLE_PREFIXES.some(prefix => 
    localPart.startsWith(prefix)
  );
  
  // Calculate score (0-100)
  let score = 100;
  
  if (isDisposable) score -= 50;
  if (isRoleAccount) score -= 20;
  
  // Check for suspicious patterns
  if (localPart.length < 3) score -= 10; // Very short local part
  if (localPart.match(/^\d+$/)) score -= 15; // Only numbers
  if (localPart.includes('test') || localPart.includes('fake')) score -= 20;
  
  // Check domain reputation (simplified)
  const trustedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
  if (trustedDomains.includes(domain)) score += 10;
  
  return {
    score: Math.max(0, Math.min(100, score)),
    isDisposable,
    isRoleAccount,
    isValid: true,
    domain,
    localPart
  };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if email is from a disposable provider
 * @param {string} email - Email to check
 * @returns {boolean} Whether email is disposable
 */
export function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const domain = email.toLowerCase().split('@')[1];
  return DISPOSABLE_DOMAINS.some(disposableDomain => 
    domain && domain.includes(disposableDomain)
  );
}

export default {
  analyzeEmailQuality,
  isValidEmail,
  isDisposableEmail
};
