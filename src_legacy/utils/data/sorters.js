/**
 * Data sorting utilities
 */

export const sortByDate = (array, key = 'createdAt', ascending = false) => {
  return [...array].sort((a, b) => {
    const dateA = new Date(key ? a[key] : a);
    const dateB = new Date(key ? b[key] : b);
    
    if (ascending) {
      return dateA - dateB;
    }
    return dateB - dateA;
  });
};

export const sortByString = (array, key, ascending = true) => {
  return [...array].sort((a, b) => {
    const valueA = key ? a[key] : a;
    const valueB = key ? b[key] : b;
    
    const strA = String(valueA || '').toLowerCase();
    const strB = String(valueB || '').toLowerCase();
    
    if (ascending) {
      return strA.localeCompare(strB);
    }
    return strB.localeCompare(strA);
  });
};

export const sortByNumber = (array, key, ascending = true) => {
  return [...array].sort((a, b) => {
    const valueA = key ? a[key] : a;
    const valueB = key ? b[key] : b;
    
    const numA = Number(valueA) || 0;
    const numB = Number(valueB) || 0;
    
    if (ascending) {
      return numA - numB;
    }
    return numB - numA;
  });
};

export const sortByBoolean = (array, key, trueFirst = true) => {
  return [...array].sort((a, b) => {
    const valueA = key ? a[key] : a;
    const valueB = key ? b[key] : b;
    
    const boolA = Boolean(valueA);
    const boolB = Boolean(valueB);
    
    if (boolA === boolB) return 0;
    
    if (trueFirst) {
      return boolA ? -1 : 1;
    }
    return boolA ? 1 : -1;
  });
};

export const sortByMultiple = (array, sorters) => {
  return [...array].sort((a, b) => {
    for (const sorter of sorters) {
      const { key, type = 'string', ascending = true } = sorter;
      
      let result = 0;
      
      switch (type) {
        case 'date':
          result = sortCompareDate(a, b, key, ascending);
          break;
        case 'number':
          result = sortCompareNumber(a, b, key, ascending);
          break;
        case 'boolean':
          result = sortCompareBoolean(a, b, key, ascending);
          break;
        default:
          result = sortCompareString(a, b, key, ascending);
      }
      
      if (result !== 0) return result;
    }
    
    return 0;
  });
};

const sortCompareDate = (a, b, key, ascending) => {
  const dateA = new Date(key ? a[key] : a);
  const dateB = new Date(key ? b[key] : b);
  
  const diff = dateA - dateB;
  return ascending ? diff : -diff;
};

const sortCompareString = (a, b, key, ascending) => {
  const valueA = key ? a[key] : a;
  const valueB = key ? b[key] : b;
  
  const strA = String(valueA || '').toLowerCase();
  const strB = String(valueB || '').toLowerCase();
  
  const result = strA.localeCompare(strB);
  return ascending ? result : -result;
};

const sortCompareNumber = (a, b, key, ascending) => {
  const valueA = key ? a[key] : a;
  const valueB = key ? b[key] : b;
  
  const numA = Number(valueA) || 0;
  const numB = Number(valueB) || 0;
  
  const diff = numA - numB;
  return ascending ? diff : -diff;
};

const sortCompareBoolean = (a, b, key, ascending) => {
  const valueA = key ? a[key] : a;
  const valueB = key ? b[key] : b;
  
  const boolA = Boolean(valueA);
  const boolB = Boolean(valueB);
  
  if (boolA === boolB) return 0;
  
  const result = boolA ? -1 : 1;
  return ascending ? result : -result;
};

export const shuffle = (array) => {
  const result = [...array];
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
};

export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = key ? item[key] : item;
    const groupKey = String(group);
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push(item);
    return groups;
  }, {});
};

export const sortGroups = (groups, sortBy = 'key', ascending = true) => {
  const entries = Object.entries(groups);
  
  entries.sort(([keyA, valueA], [keyB, valueB]) => {
    let compareA, compareB;
    
    if (sortBy === 'key') {
      compareA = keyA;
      compareB = keyB;
    } else if (sortBy === 'count') {
      compareA = valueA.length;
      compareB = valueB.length;
    } else {
      compareA = keyA;
      compareB = keyB;
    }
    
    let result;
    if (typeof compareA === 'number' && typeof compareB === 'number') {
      result = compareA - compareB;
    } else {
      result = String(compareA).localeCompare(String(compareB));
    }
    
    return ascending ? result : -result;
  });
  
  return Object.fromEntries(entries);
};

export const naturalSort = (array, key) => {
  return [...array].sort((a, b) => {
    const valueA = key ? a[key] : a;
    const valueB = key ? b[key] : b;
    
    return String(valueA).localeCompare(String(valueB), undefined, {
      numeric: true,
      sensitivity: 'base'
    });
  });
};

export default {
  sortByDate,
  sortByString,  
  sortByNumber,
  sortByBoolean,
  sortByMultiple,
  shuffle,
  groupBy,
  sortGroups,
  naturalSort
};
