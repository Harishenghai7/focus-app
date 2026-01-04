/**
 * Debounce utility function
 */

export const debounce = (func, wait, immediate = false) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(this, args);
  };
};

export const debounceAsync = (func, wait, immediate = false) => {
  let timeout;
  let resolveList = [];
  let rejectList = [];
  
  return function executedFunction(...args) {
    return new Promise((resolve, reject) => {
      resolveList.push(resolve);
      rejectList.push(reject);
      
      const later = async () => {
        timeout = null;
        if (!immediate) {
          try {
            const result = await func.apply(this, args);
            resolveList.forEach(resolve => resolve(result));
            resolveList = [];
            rejectList = [];
          } catch (error) {
            rejectList.forEach(reject => reject(error));
            resolveList = [];
            rejectList = [];
          }
        }
      };
      
      const callNow = immediate && !timeout;
      
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      
      if (callNow) {
        func.apply(this, args)
          .then(result => {
            resolveList.forEach(resolve => resolve(result));
            resolveList = [];
            rejectList = [];
          })
          .catch(error => {
            rejectList.forEach(reject => reject(error));
            resolveList = [];
            rejectList = [];
          });
      }
    });
  };
};

export const debounceLeading = (func, wait) => {
  return debounce(func, wait, true);
};

export const debounceTrailing = (func, wait) => {
  return debounce(func, wait, false);
};

export const debounceBoth = (func, wait) => {
  let timeout;
  let lastCallTime = 0;
  
  return function executedFunction(...args) {
    const currentTime = Date.now();
    
    const later = () => {
      timeout = null;
      if (currentTime - lastCallTime >= wait) {
        lastCallTime = currentTime;
        func.apply(this, args);
      }
    };
    
    // Call immediately if it's the first call or enough time has passed
    if (!timeout || currentTime - lastCallTime >= wait) {
      lastCallTime = currentTime;
      func.apply(this, args);
    }
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const createDebouncer = () => {
  const timeouts = new Map();
  
  return {
    debounce: (key, func, wait, immediate = false) => {
      const existingTimeout = timeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      const timeout = setTimeout(() => {
        timeouts.delete(key);
        if (!immediate) func();
      }, wait);
      
      timeouts.set(key, timeout);
      
      if (immediate && !existingTimeout) {
        func();
      }
    },
    
    cancel: (key) => {
      const timeout = timeouts.get(key);
      if (timeout) {
        clearTimeout(timeout);
        timeouts.delete(key);
      }
    },
    
    cancelAll: () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      timeouts.clear();
    },
    
    isPending: (key) => {
      return timeouts.has(key);
    },
    
    getPendingCount: () => {
      return timeouts.size;
    }
  };
};

export const debounceMap = (func, wait, keySelector = (...args) => JSON.stringify(args)) => {
  const timeouts = new Map();
  
  return function executedFunction(...args) {
    const key = keySelector(...args);
    const existingTimeout = timeouts.get(key);
    
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    const timeout = setTimeout(() => {
      timeouts.delete(key);
      func.apply(this, args);
    }, wait);
    
    timeouts.set(key, timeout);
  };
};

export const debounceWithCancel = (func, wait, immediate = false) => {
  let timeout;
  
  const debouncedFunction = function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(this, args);
  };
  
  debouncedFunction.cancel = () => {
    clearTimeout(timeout);
    timeout = null;
  };
  
  debouncedFunction.isPending = () => {
    return timeout !== null;
  };
  
  debouncedFunction.flush = (...args) => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
      func.apply(this, args);
    }
  };
  
  return debouncedFunction;
};

export const debouncePromise = (func, wait) => {
  let timeout;
  let pendingPromise;
  
  return function executedFunction(...args) {
    if (pendingPromise) {
      return pendingPromise;
    }
    
    pendingPromise = new Promise((resolve, reject) => {
      const later = async () => {
        timeout = null;
        pendingPromise = null;
        
        try {
          const result = await func.apply(this, args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    });
    
    return pendingPromise;
  };
};

export const debounceRaf = (func) => {
  let rafId;
  
  return function executedFunction(...args) {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    
    rafId = requestAnimationFrame(() => {
      rafId = null;
      func.apply(this, args);
    });
  };
};

export const debounceIdle = (func, timeout = 5000) => {
  let idleId;
  
  return function executedFunction(...args) {
    if (idleId) {
      cancelIdleCallback(idleId);
    }
    
    if (typeof requestIdleCallback !== 'undefined') {
      idleId = requestIdleCallback(() => {
        idleId = null;
        func.apply(this, args);
      }, { timeout });
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(() => {
        func.apply(this, args);
      }, 0);
    }
  };
};

// Utility to create debounce with different strategies
export const createDebouncedFunction = (func, options = {}) => {
  const {
    wait = 300,
    immediate = false,
    maxWait = null,
    trailing = true,
    leading = false
  } = options;
  
  let timeout;
  let maxTimeout;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  
  return function executedFunction(...args) {
    const currentTime = Date.now();
    const timeSinceLastCall = currentTime - lastCallTime;
    const timeSinceLastInvoke = currentTime - lastInvokeTime;
    
    lastCallTime = currentTime;
    
    const invokeFunc = () => {
      lastInvokeTime = currentTime;
      return func.apply(this, args);
    };
    
    const shouldInvokeLeading = leading && (!timeout || timeSinceLastInvoke >= wait);
    const shouldInvokeMaxWait = maxWait && timeSinceLastInvoke >= maxWait;
    
    if (shouldInvokeLeading || shouldInvokeMaxWait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      if (maxTimeout) {
        clearTimeout(maxTimeout);
        maxTimeout = null;
      }
      return invokeFunc();
    }
    
    if (!timeout && trailing) {
      timeout = setTimeout(() => {
        timeout = null;
        if (maxTimeout) {
          clearTimeout(maxTimeout);
          maxTimeout = null;
        }
        invokeFunc();
      }, wait);
    }
    
    if (maxWait && !maxTimeout) {
      maxTimeout = setTimeout(() => {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        maxTimeout = null;
        invokeFunc();
      }, maxWait);
    }
  };
};

export default {
  debounce,
  debounceAsync,
  debounceLeading,
  debounceTrailing,
  debounceBoth,
  createDebouncer,
  debounceMap,
  debounceWithCancel,
  debouncePromise,
  debounceRaf,
  debounceIdle,
  createDebouncedFunction
};
