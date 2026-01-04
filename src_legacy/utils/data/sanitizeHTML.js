/**
 * HTML sanitization utilities
 */

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 'del',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td'
];

const ALLOWED_ATTRIBUTES = {
  'a': ['href', 'title', 'target', 'rel'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'blockquote': ['cite'],
  'pre': ['class'],
  'code': ['class']
};

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

export const sanitizeHTML = (html) => {
  if (typeof html !== 'string') return '';
  
  // Remove script tags and their content
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and their content
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove event handlers
  html = html.replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');
  
  // Remove javascript: and data: protocols
  html = html.replace(/\s*href\s*=\s*(?:"[^"]*javascript:[^"]*"|'[^']*javascript:[^']*'|javascript:[^\s>]*)/gi, '');
  html = html.replace(/\s*src\s*=\s*(?:"[^"]*data:[^"]*"|'[^']*data:[^']*'|data:[^\s>]*)/gi, '');
  
  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  return sanitizeNode(temp).innerHTML;
};

const sanitizeNode = (node) => {
  const result = document.createElement('div');
  
  Array.from(node.childNodes).forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      result.appendChild(document.createTextNode(child.textContent));
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const tagName = child.tagName.toLowerCase();
      
      if (ALLOWED_TAGS.includes(tagName)) {
        const newElement = document.createElement(tagName);
        
        // Copy allowed attributes
        if (ALLOWED_ATTRIBUTES[tagName]) {
          ALLOWED_ATTRIBUTES[tagName].forEach(attr => {
            const value = child.getAttribute(attr);
            if (value) {
              if (attr === 'href' || attr === 'src') {
                if (isValidUrl(value)) {
                  newElement.setAttribute(attr, value);
                }
              } else {
                newElement.setAttribute(attr, value);
              }
            }
          });
        }
        
        // Recursively sanitize children
        const sanitizedChild = sanitizeNode(child);
        while (sanitizedChild.firstChild) {
          newElement.appendChild(sanitizedChild.firstChild);
        }
        
        result.appendChild(newElement);
      } else {
        // For non-allowed tags, just add their text content
        result.appendChild(document.createTextNode(child.textContent));
      }
    }
  });
  
  return result;
};

const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url, window.location.origin);
    return ALLOWED_PROTOCOLS.includes(urlObj.protocol);
  } catch {
    return false;
  }
};

export const stripHTML = (html) => {
  if (typeof html !== 'string') return '';
  
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

export const escapeHTML = (text) => {
  if (typeof text !== 'string') return '';
  
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
};

export const unescapeHTML = (html) => {
  if (typeof html !== 'string') return '';
  
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

export const isValidHTML = (html) => {
  try {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.innerHTML === html;
  } catch {
    return false;
  }
};

export const removeEmptyTags = (html) => {
  if (typeof html !== 'string') return '';
  
  // Remove empty tags (except self-closing ones)
  return html.replace(/<(?!area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)([a-z][a-z0-9]*)\b[^>]*>[\s]*<\/\1>/gi, '');
};

export const limitHTML = (html, maxLength = 1000) => {
  if (typeof html !== 'string') return '';
  
  if (html.length <= maxLength) return html;
  
  const truncated = html.substring(0, maxLength);
  const lastTagIndex = truncated.lastIndexOf('<');
  const lastCloseIndex = truncated.lastIndexOf('>');
  
  if (lastTagIndex > lastCloseIndex) {
    // We're in the middle of a tag, truncate before it
    return truncated.substring(0, lastTagIndex);
  }
  
  return truncated;
};

export const sanitizeForDisplay = (html) => {
  return removeEmptyTags(sanitizeHTML(html));
};

export default {
  sanitizeHTML,
  stripHTML,
  escapeHTML,
  unescapeHTML,
  isValidHTML,
  removeEmptyTags,
  limitHTML,
  sanitizeForDisplay
};
