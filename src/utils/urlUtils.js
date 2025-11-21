/**
 * URL utilities
 */

export const parseUrl = (url) => {
  try {
    return new URL(url);
  } catch (error) {
    console.error('Invalid URL:', url);
    return null;
  }
};

export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isAbsoluteUrl = (url) => {
  return /^https?:\/\//.test(url);
};

export const isRelativeUrl = (url) => {
  return !isAbsoluteUrl(url);
};

export const joinUrl = (...parts) => {
  return parts
    .map((part, index) => {
      if (index === 0) {
        return part.replace(/\/+$/, '');
      } else {
        return part.replace(/^\/+/, '').replace(/\/+$/, '');
      }
    })
    .join('/');
};

export const addQueryParams = (url, params) => {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }
  
  const urlObj = new URL(url, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      urlObj.searchParams.set(key, value);
    }
  });
  
  return urlObj.toString();
};

export const removeQueryParams = (url, paramsToRemove) => {
  const urlObj = new URL(url, window.location.origin);
  
  paramsToRemove.forEach(param => {
    urlObj.searchParams.delete(param);
  });
  
  return urlObj.toString();
};

export const getQueryParams = (url = window.location.href) => {
  const urlObj = new URL(url, window.location.origin);
  const params = {};
  
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
};

export const getQueryParam = (key, url = window.location.href) => {
  const urlObj = new URL(url, window.location.origin);
  return urlObj.searchParams.get(key);
};

export const updateQueryParams = (params, replace = false) => {
  const url = new URL(window.location);
  
  if (replace) {
    // Clear all existing params
    url.search = '';
  }
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  });
  
  const newUrl = url.toString();
  
  if (newUrl !== window.location.href) {
    window.history.pushState({}, '', newUrl);
  }
  
  return newUrl;
};

export const replaceQueryParams = (params) => {
  return updateQueryParams(params, true);
};

export const getBaseUrl = (url = window.location.href) => {
  const urlObj = new URL(url);
  return `${urlObj.protocol}//${urlObj.host}`;
};

export const getOrigin = (url = window.location.href) => {
  const urlObj = new URL(url);
  return urlObj.origin;
};

export const getPathname = (url = window.location.href) => {
  const urlObj = new URL(url);
  return urlObj.pathname;
};

export const getHash = (url = window.location.href) => {
  const urlObj = new URL(url);
  return urlObj.hash;
};

export const removeHash = (url) => {
  return url.split('#')[0];
};

export const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
};

export const extractSubdomain = (url) => {
  const domain = extractDomain(url);
  if (!domain) return null;
  
  const parts = domain.split('.');
  if (parts.length > 2) {
    return parts[0];
  }
  
  return null;
};

export const isSameDomain = (url1, url2) => {
  const domain1 = extractDomain(url1);
  const domain2 = extractDomain(url2);
  
  return domain1 && domain2 && domain1 === domain2;
};

export const isSameOrigin = (url1, url2) => {
  try {
    const origin1 = new URL(url1).origin;
    const origin2 = new URL(url2).origin;
    return origin1 === origin2;
  } catch {
    return false;
  }
};

export const isExternalUrl = (url, currentOrigin = window.location.origin) => {
  try {
    const urlObj = new URL(url);
    return urlObj.origin !== currentOrigin;
  } catch {
    return false;
  }
};

export const normalizeUrl = (url) => {
  try {
    const urlObj = new URL(url);
    
    // Remove default ports
    if (
      (urlObj.protocol === 'http:' && urlObj.port === '80') ||
      (urlObj.protocol === 'https:' && urlObj.port === '443')
    ) {
      urlObj.port = '';
    }
    
    // Remove trailing slash from pathname unless it's the root
    if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    
    // Sort query parameters
    const sortedParams = new URLSearchParams(
      Array.from(urlObj.searchParams.entries()).sort()
    );
    urlObj.search = sortedParams.toString();
    
    return urlObj.toString();
  } catch {
    return url;
  }
};

export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

export const createSlug = (title, maxLength = 50) => {
  let slug = slugify(title);
  
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Remove incomplete word at the end
    const lastDash = slug.lastIndexOf('-');
    if (lastDash > 0) {
      slug = slug.substring(0, lastDash);
    }
  }
  
  return slug;
};

export const buildUrl = (baseUrl, path = '', params = {}) => {
  let url = joinUrl(baseUrl, path);
  
  if (Object.keys(params).length > 0) {
    url = addQueryParams(url, params);
  }
  
  return url;
};

export const getFileExtension = (url) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastDot = pathname.lastIndexOf('.');
    
    if (lastDot > 0) {
      return pathname.substring(lastDot + 1).toLowerCase();
    }
  } catch {
    // If URL parsing fails, try extracting from string directly
    const lastDot = url.lastIndexOf('.');
    const lastSlash = url.lastIndexOf('/');
    
    if (lastDot > lastSlash) {
      return url.substring(lastDot + 1).toLowerCase();
    }
  }
  
  return '';
};

export const getFileName = (url) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastSlash = pathname.lastIndexOf('/');
    
    if (lastSlash > -1) {
      return pathname.substring(lastSlash + 1);
    }
    
    return pathname;
  } catch {
    const lastSlash = url.lastIndexOf('/');
    if (lastSlash > -1) {
      return url.substring(lastSlash + 1);
    }
    return url;
  }
};

export const stripFileExtension = (filename) => {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot > 0) {
    return filename.substring(0, lastDot);
  }
  return filename;
};

export const addProtocol = (url, protocol = 'https:') => {
  if (!/^https?:\/\//.test(url)) {
    return `${protocol}//${url}`;
  }
  return url;
};

export const removeProtocol = (url) => {
  return url.replace(/^https?:\/\//, '');
};

export const getUrlSegments = (url = window.location.href) => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.split('/').filter(segment => segment.length > 0);
  } catch {
    return [];
  }
};

export const matchUrl = (pattern, url = window.location.pathname) => {
  const patternParts = pattern.split('/').filter(part => part.length > 0);
  const urlParts = url.split('/').filter(part => part.length > 0);
  
  if (patternParts.length !== urlParts.length) {
    return null;
  }
  
  const params = {};
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const urlPart = urlParts[i];
    
    if (patternPart.startsWith(':')) {
      // Parameter
      const paramName = patternPart.substring(1);
      params[paramName] = decodeURIComponent(urlPart);
    } else if (patternPart !== urlPart) {
      // Exact match required
      return null;
    }
  }
  
  return params;
};

export const encodeUrlComponent = (str) => {
  return encodeURIComponent(str);
};

export const decodeUrlComponent = (str) => {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
};

export const createDataUrl = (data, mimeType = 'text/plain') => {
  const encoded = btoa(unescape(encodeURIComponent(data)));
  return `data:${mimeType};base64,${encoded}`;
};

export const parseDataUrl = (dataUrl) => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return {
      mimeType: match[1],
      data: atob(match[2])
    };
  }
  return null;
};

export default {
  parseUrl,
  isValidUrl,
  isAbsoluteUrl,
  isRelativeUrl,
  joinUrl,
  addQueryParams,
  removeQueryParams,
  getQueryParams,
  getQueryParam,
  updateQueryParams,
  replaceQueryParams,
  getBaseUrl,
  getOrigin,
  getPathname,
  getHash,
  removeHash,
  extractDomain,
  extractSubdomain,
  isSameDomain,
  isSameOrigin,
  isExternalUrl,
  normalizeUrl,
  slugify,
  createSlug,
  buildUrl,
  getFileExtension,
  getFileName,
  stripFileExtension,
  addProtocol,
  removeProtocol,
  getUrlSegments,
  matchUrl,
  encodeUrlComponent,
  decodeUrlComponent,
  createDataUrl,
  parseDataUrl
};
