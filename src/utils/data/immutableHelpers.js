/**
 * Immutable data helpers
 */

export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
};

export const deepFreeze = (obj) => {
  Object.getOwnPropertyNames(obj).forEach(name => {
    const value = obj[name];
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  });
  return Object.freeze(obj);
};

export const immutableUpdate = (obj, path, value) => {
  const keys = Array.isArray(path) ? path : path.split('.');
  const [head, ...rest] = keys;
  
  if (keys.length === 1) {
    return { ...obj, [head]: value };
  }
  
  return {
    ...obj,
    [head]: immutableUpdate(obj[head] || {}, rest, value)
  };
};

export const immutableDelete = (obj, path) => {
  const keys = Array.isArray(path) ? path : path.split('.');
  const [head, ...rest] = keys;
  
  if (keys.length === 1) {
    const { [head]: deleted, ...remaining } = obj;
    return remaining;
  }
  
  if (!obj[head]) return obj;
  
  return {
    ...obj,
    [head]: immutableDelete(obj[head], rest)
  };
};

export const immutablePush = (array, item) => {
  return [...array, item];
};

export const immutablePop = (array) => {
  return array.slice(0, -1);
};

export const immutableShift = (array) => {
  return array.slice(1);
};

export const immutableUnshift = (array, item) => {
  return [item, ...array];
};

export const immutableSplice = (array, start, deleteCount = 0, ...items) => {
  return [
    ...array.slice(0, start),
    ...items,
    ...array.slice(start + deleteCount)
  ];
};

export const immutableSort = (array, compareFn) => {
  return [...array].sort(compareFn);
};

export const immutableReverse = (array) => {
  return [...array].reverse();
};

export const immutableFilter = (array, predicate) => {
  return array.filter(predicate);
};

export const immutableMap = (array, transform) => {
  return array.map(transform);
};

export const immutableReduce = (array, reducer, initialValue) => {
  return array.reduce(reducer, initialValue);
};

export const isImmutable = (obj) => {
  return Object.isFrozen(obj);
};

export const getIn = (obj, path, defaultValue) => {
  const keys = Array.isArray(path) ? path : path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current !== undefined ? current : defaultValue;
};

export const setIn = (obj, path, value) => {
  return immutableUpdate(obj, path, value);
};

export const deleteIn = (obj, path) => {
  return immutableDelete(obj, path);
};

export default {
  deepClone,
  deepFreeze,
  immutableUpdate,
  immutableDelete,
  immutablePush,
  immutablePop,
  immutableShift,
  immutableUnshift,
  immutableSplice,
  immutableSort,
  immutableReverse,
  immutableFilter,
  immutableMap,
  immutableReduce,
  isImmutable,
  getIn,
  setIn,
  deleteIn
};
