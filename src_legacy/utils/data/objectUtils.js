/**
 * Object manipulation utilities
 */

export const isEmpty = (obj) => {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  if (obj instanceof Map || obj instanceof Set) return obj.size === 0;
  return Object.keys(obj).length === 0;
};

export const isEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => 
      keysB.includes(key) && isEqual(a[key], b[key])
    );
  }
  
  return false;
};

export const pick = (obj, keys) => {
  const result = {};
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

export const merge = (...objects) => {
  return Object.assign({}, ...objects);
};

export const deepMerge = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
};

export const get = (obj, path, defaultValue) => {
  const keys = Array.isArray(path) ? path : path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
};

export const set = (obj, path, value) => {
  const keys = Array.isArray(path) ? path : path.replace(/\[(\d+)\]/g, '.$1').split('.');
  const result = { ...obj };
  let current = result;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  return result;
};

export const has = (obj, path) => {
  const keys = Array.isArray(path) ? path : path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      return false;
    }
    current = current[key];
  }
  
  return true;
};

export const keys = (obj) => {
  return Object.keys(obj || {});
};

export const values = (obj) => {
  return Object.values(obj || {});
};

export const entries = (obj) => {
  return Object.entries(obj || {});
};

export const flatten = (obj, prefix = '', result = {}) => {
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (isObject(obj[key]) && !Array.isArray(obj[key])) {
      flatten(obj[key], newKey, result);
    } else {
      result[newKey] = obj[key];
    }
  }
  
  return result;
};

export const unflatten = (obj) => {
  const result = {};
  
  for (const key in obj) {
    set(result, key, obj[key]);
  }
  
  return result;
};

export const size = (obj) => {
  if (obj == null) return 0;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length;
  if (obj instanceof Map || obj instanceof Set) return obj.size;
  return Object.keys(obj).length;
};

export const isObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

export const clone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(clone);
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = clone(obj[key]);
    }
  }
  return cloned;
};

export const mapValues = (obj, iteratee) => {
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = iteratee(obj[key], key, obj);
    }
  }
  return result;
};

export const mapKeys = (obj, iteratee) => {
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = iteratee(obj[key], key, obj);
      result[newKey] = obj[key];
    }
  }
  return result;
};

export default {
  isEmpty,
  isEqual,
  pick,
  omit,
  merge,
  deepMerge,
  get,
  set,
  has,
  keys,
  values,
  entries,
  flatten,
  unflatten,
  size,
  isObject,
  clone,
  mapValues,
  mapKeys
};
