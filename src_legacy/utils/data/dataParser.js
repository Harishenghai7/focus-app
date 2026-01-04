/**
 * Data parsing utilities
 */

export const parseJSON = (data, fallback = null) => {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
};

export const parseURL = (url) => {
  try {
    return new URL(url);
  } catch (error) {
    console.warn('Failed to parse URL:', error);
    return null;
  }
};

export const parseMarkdown = (text) => {
  // Basic markdown parsing
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
};

export const parseCSV = (csv) => {
  const lines = csv.split('\n');
  const result = [];
  
  if (lines.length === 0) return result;
  
  const headers = lines[0].split(',').map(h => h.trim());
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    
    result.push(obj);
  }
  
  return result;
};

export const parseQueryString = (queryString) => {
  const params = new URLSearchParams(queryString);
  const result = {};
  
  for (const [key, value] of params) {
    result[key] = value;
  }
  
  return result;
};

export const stringifyJSON = (data, space = 0) => {
  try {
    return JSON.stringify(data, null, space);
  } catch (error) {
    console.warn('Failed to stringify JSON:', error);
    return '';
  }
};

export const parseDate = (dateString) => {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

export const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
};

export default {
  parseJSON,
  parseURL,
  parseMarkdown,
  parseCSV,
  parseQueryString,
  stringifyJSON,
  parseDate,
  parseBoolean
};
