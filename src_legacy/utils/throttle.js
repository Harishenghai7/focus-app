/**
 * Throttle utility function
 */

export const throttle = (func, limit, options = {}) => {
  const { leading = true, trailing = true } = options;
  let inThrottle;
  let lastFunc;
  let lastRan;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      if (leading) {
        func.apply(this, args);
        lastRan = Date.now();
      }
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          if (trailing) {
            func.apply(this, args);
          }
          lastRan = Date.now();
          inThrottle = false;
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

export const throttleAsync = (func, limit, options = {}) => {
  const { leading = true, trailing = true } = options;
  let inThrottle;
  let lastFunc;
  let lastRan;
  let pendingPromise;
  
  return function executedFunction(...args) {
    return new Promise((resolve, reject) => {
      const executeFunc = async () => {
        try {
          const result = await func.apply(this, args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      if (!inThrottle) {
        if (leading) {
          executeFunc();
          lastRan = Date.now();
        } else if (trailing) {
          pendingPromise = { resolve, reject, args };
        }
        inThrottle = true;
      } else {
        pendingPromise = { resolve, reject, args };
        clearTimeout(lastFunc);
        lastFunc = setTimeout(async () => {
          if (Date.now() - lastRan >= limit) {
            if (trailing && pendingPromise) {
              try {
                const result = await func.apply(this, pendingPromise.args);
                pendingPromise.resolve(result);
              } catch (error) {
                pendingPromise.reject(error);
              }
              pendingPromise = null;
            }
            lastRan = Date.now();
            inThrottle = false;
          }
        }, limit - (Date.now() - lastRan));
      }
    });
  };
};

export const throttleLeading = (func, limit) => {
  return throttle(func, limit, { leading: true, trailing: false });
};

export const throttleTrailing = (func, limit) => {
  return throttle(func, limit, { leading: false, trailing: true });
};

export const throttleBoth = (func, limit) => {
  return throttle(func, limit, { leading: true, trailing: true });
};

export const createThrottler = () => {
  const throttles = new Map();
  
  return {
    throttle: (key, func, limit, options = {}) => {
      const { leading = true, trailing = true } = options;
      
      if (!throttles.has(key)) {
        throttles.set(key, {
          inThrottle: false,
          lastFunc: null,
          lastRan: null
        });
      }
      
      const state = throttles.get(key);
      
      if (!state.inThrottle) {
        if (leading) {
          func();
          state.lastRan = Date.now();
        }
        state.inThrottle = true;
      } else {
        clearTimeout(state.lastFunc);
        state.lastFunc = setTimeout(() => {
          if (Date.now() - state.lastRan >= limit) {
            if (trailing) {
              func();
            }
            state.lastRan = Date.now();
            state.inThrottle = false;
          }
        }, limit - (Date.now() - state.lastRan));
      }
    },
    
    cancel: (key) => {
      const state = throttles.get(key);
      if (state && state.lastFunc) {
        clearTimeout(state.lastFunc);
        state.inThrottle = false;
        state.lastFunc = null;
      }
    },
    
    cancelAll: () => {
      throttles.forEach(state => {
        if (state.lastFunc) {
          clearTimeout(state.lastFunc);
        }
      });
      throttles.clear();
    },
    
    isActive: (key) => {
      const state = throttles.get(key);
      return state ? state.inThrottle : false;
    },
    
    getActiveCount: () => {
      let count = 0;
      throttles.forEach(state => {
        if (state.inThrottle) count++;
      });
      return count;
    }
  };
};

export const throttleMap = (func, limit, keySelector = (...args) => JSON.stringify(args)) => {
  const throttles = new Map();
  
  return function executedFunction(...args) {
    const key = keySelector(...args);
    
    if (!throttles.has(key)) {
      throttles.set(key, {
        inThrottle: false,
        lastFunc: null,
        lastRan: null
      });
    }
    
    const state = throttles.get(key);
    
    if (!state.inThrottle) {
      func.apply(this, args);
      state.lastRan = Date.now();
      state.inThrottle = true;
    } else {
      clearTimeout(state.lastFunc);
      state.lastFunc = setTimeout(() => {
        if (Date.now() - state.lastRan >= limit) {
          func.apply(this, args);
          state.lastRan = Date.now();
          state.inThrottle = false;
        }
      }, limit - (Date.now() - state.lastRan));
    }
  };
};

export const throttleWithCancel = (func, limit, options = {}) => {
  const { leading = true, trailing = true } = options;
  let inThrottle;
  let lastFunc;
  let lastRan;
  
  const throttledFunction = function executedFunction(...args) {
    if (!inThrottle) {
      if (leading) {
        func.apply(this, args);
        lastRan = Date.now();
      }
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          if (trailing) {
            func.apply(this, args);
          }
          lastRan = Date.now();
          inThrottle = false;
        }
      }, limit - (Date.now() - lastRan));
    }
  };
  
  throttledFunction.cancel = () => {
    clearTimeout(lastFunc);
    inThrottle = false;
    lastFunc = null;
    lastRan = null;
  };
  
  throttledFunction.isActive = () => {
    return inThrottle;
  };
  
  throttledFunction.flush = (...args) => {
    if (inThrottle) {
      clearTimeout(lastFunc);
      func.apply(this, args);
      lastRan = Date.now();
      inThrottle = false;
    }
  };
  
  return throttledFunction;
};

export const throttleRaf = (func) => {
  let rafId;
  let isScheduled = false;
  
  return function executedFunction(...args) {
    if (isScheduled) return;
    
    isScheduled = true;
    rafId = requestAnimationFrame(() => {
      isScheduled = false;
      func.apply(this, args);
    });
  };
};

export const throttleIdle = (func, timeout = 5000) => {
  let idleId;
  let isScheduled = false;
  
  return function executedFunction(...args) {
    if (isScheduled) return;
    
    isScheduled = true;
    
    if (typeof requestIdleCallback !== 'undefined') {
      idleId = requestIdleCallback(() => {
        isScheduled = false;
        func.apply(this, args);
      }, { timeout });
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(() => {
        isScheduled = false;
        func.apply(this, args);
      }, 0);
    }
  };
};

export const throttleFrame = (func, frameCount = 1) => {
  let frameCounter = 0;
  
  return function executedFunction(...args) {
    frameCounter++;
    if (frameCounter >= frameCount) {
      frameCounter = 0;
      requestAnimationFrame(() => {
        func.apply(this, args);
      });
    }
  };
};

export const throttleTime = (func, interval) => {
  let lastExecution = 0;
  
  return function executedFunction(...args) {
    const now = Date.now();
    if (now - lastExecution >= interval) {
      lastExecution = now;
      func.apply(this, args);
    }
  };
};

export const adaptiveThrottle = (func, baseLimit = 100, maxLimit = 1000) => {
  let currentLimit = baseLimit;
  let lastRun = 0;
  let execCount = 0;
  let lastExecTime = 0;
  
  return function executedFunction(...args) {
    const now = Date.now();
    
    // Adjust throttle limit based on execution frequency
    if (execCount > 0) {
      const avgExecTime = (now - lastExecTime) / execCount;
      if (avgExecTime < baseLimit) {
        currentLimit = Math.min(currentLimit * 1.1, maxLimit);
      } else {
        currentLimit = Math.max(currentLimit * 0.9, baseLimit);
      }
    }
    
    if (now - lastRun >= currentLimit) {
      lastRun = now;
      execCount++;
      if (execCount === 1) {
        lastExecTime = now;
      }
      func.apply(this, args);
    }
  };
};

// Utility to create throttle with different strategies
export const createThrottledFunction = (func, options = {}) => {
  const {
    limit = 100,
    leading = true,
    trailing = true,
    maxWait = null
  } = options;
  
  let inThrottle;
  let lastFunc;
  let lastRan;
  let maxTimeout;
  
  return function executedFunction(...args) {
    const currentTime = Date.now();
    
    const invokeFunc = () => {
      lastRan = currentTime;
      return func.apply(this, args);
    };
    
    const shouldInvokeLeading = leading && !inThrottle;
    const shouldInvokeMaxWait = maxWait && inThrottle && (currentTime - lastRan >= maxWait);
    
    if (shouldInvokeLeading || shouldInvokeMaxWait) {
      if (lastFunc) {
        clearTimeout(lastFunc);
        lastFunc = null;
      }
      if (maxTimeout) {
        clearTimeout(maxTimeout);
        maxTimeout = null;
      }
      inThrottle = true;
      return invokeFunc();
    }
    
    if (!inThrottle) {
      inThrottle = true;
    }
    
    if (trailing) {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        const timeSinceLastRan = Date.now() - lastRan;
        if (timeSinceLastRan >= limit) {
          invokeFunc();
          inThrottle = false;
          if (maxTimeout) {
            clearTimeout(maxTimeout);
            maxTimeout = null;
          }
        } else {
          lastFunc = setTimeout(() => {
            invokeFunc();
            inThrottle = false;
          }, limit - timeSinceLastRan);
        }
      }, limit);
    }
    
    if (maxWait && !maxTimeout) {
      maxTimeout = setTimeout(() => {
        if (lastFunc) {
          clearTimeout(lastFunc);
          lastFunc = null;
        }
        invokeFunc();
        inThrottle = false;
        maxTimeout = null;
      }, maxWait);
    }
  };
};

export default {
  throttle,
  throttleAsync,
  throttleLeading,
  throttleTrailing,
  throttleBoth,
  createThrottler,
  throttleMap,
  throttleWithCancel,
  throttleRaf,
  throttleIdle,
  throttleFrame,
  throttleTime,
  adaptiveThrottle,
  createThrottledFunction
};
