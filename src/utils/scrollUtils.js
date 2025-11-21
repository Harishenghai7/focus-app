/**
 * Scroll utilities
 */

export const scrollToTop = (options = {}) => {
  const { smooth = true, element = window } = options;
  
  if (element === window) {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: smooth ? 'smooth' : 'auto'
    });
  } else {
    element.scrollTo({
      top: 0,
      left: 0,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }
};

export const scrollToBottom = (options = {}) => {
  const { smooth = true, element = window } = options;
  
  if (element === window) {
    window.scrollTo({
      top: document.body.scrollHeight,
      left: 0,
      behavior: smooth ? 'smooth' : 'auto'
    });
  } else {
    element.scrollTo({
      top: element.scrollHeight,
      left: 0,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }
};

export const scrollToElement = (targetElement, options = {}) => {
  if (!targetElement) return;
  
  const {
    smooth = true,
    block = 'start',
    inline = 'nearest',
    offset = 0
  } = options;
  
  if (offset !== 0) {
    const elementTop = targetElement.getBoundingClientRect().top + window.pageYOffset;
    const offsetTop = elementTop + offset;
    
    window.scrollTo({
      top: offsetTop,
      behavior: smooth ? 'smooth' : 'auto'
    });
  } else {
    targetElement.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block,
      inline
    });
  }
};

export const scrollToId = (id, options = {}) => {
  const element = document.getElementById(id);
  if (element) {
    scrollToElement(element, options);
  }
};

export const getScrollPosition = (element = window) => {
  if (element === window) {
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
      y: window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    };
  } else {
    return {
      x: element.scrollLeft,
      y: element.scrollTop
    };
  }
};

export const setScrollPosition = (x, y, options = {}) => {
  const { smooth = false, element = window } = options;
  
  if (element === window) {
    window.scrollTo({
      left: x,
      top: y,
      behavior: smooth ? 'smooth' : 'auto'
    });
  } else {
    element.scrollTo({
      left: x,
      top: y,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }
};

export const getScrollPercent = (element = window) => {
  if (element === window) {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    return scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  } else {
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    return scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  }
};

export const isScrolledToBottom = (element = window, threshold = 5) => {
  const scrollPercent = getScrollPercent(element);
  return scrollPercent >= (100 - threshold);
};

export const isScrolledToTop = (element = window, threshold = 5) => {
  const scrollPercent = getScrollPercent(element);
  return scrollPercent <= threshold;
};

export const getScrollDirection = (() => {
  let lastScrollY = 0;
  let direction = 'none';
  
  return (element = window) => {
    const currentScrollY = getScrollPosition(element).y;
    
    if (currentScrollY > lastScrollY) {
      direction = 'down';
    } else if (currentScrollY < lastScrollY) {
      direction = 'up';
    } else {
      direction = 'none';
    }
    
    lastScrollY = currentScrollY;
    return direction;
  };
})();

export const createScrollSpy = (elements, options = {}) => {
  const {
    offset = 0,
    threshold = 0.5,
    rootMargin = '0px'
  } = options;
  
  const callbacks = new Map();
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const callback = callbacks.get(entry.target);
        if (callback) {
          callback(entry.isIntersecting, entry);
        }
      });
    },
    {
      threshold,
      rootMargin
    }
  );
  
  return {
    observe: (element, callback) => {
      callbacks.set(element, callback);
      observer.observe(element);
    },
    
    unobserve: (element) => {
      callbacks.delete(element);
      observer.unobserve(element);
    },
    
    disconnect: () => {
      callbacks.clear();
      observer.disconnect();
    }
  };
};

export const smoothScrollTo = (target, duration = 500, easing = 'easeInOutQuad') => {
  const start = window.pageYOffset;
  const targetY = typeof target === 'number' ? target : target.getBoundingClientRect().top + start;
  const distance = targetY - start;
  const startTime = performance.now();
  
  const easings = {
    linear: (t) => t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => (--t) * t * t + 1,
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
  };
  
  const easingFn = easings[easing] || easings.easeInOutQuad;
  
  const animateScroll = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easingFn(progress);
    
    window.scrollTo(0, start + distance * easeProgress);
    
    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  };
  
  requestAnimationFrame(animateScroll);
};

export const onScroll = (callback, options = {}) => {
  const { throttle = true, throttleDelay = 16 } = options;
  
  let timeoutId;
  
  const handleScroll = (event) => {
    if (throttle) {
      if (timeoutId) return;
      
      timeoutId = setTimeout(() => {
        callback(event);
        timeoutId = null;
      }, throttleDelay);
    } else {
      callback(event);
    }
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
};

export const onElementScroll = (element, callback, options = {}) => {
  const { throttle = true, throttleDelay = 16 } = options;
  
  let timeoutId;
  
  const handleScroll = (event) => {
    if (throttle) {
      if (timeoutId) return;
      
      timeoutId = setTimeout(() => {
        callback(event);
        timeoutId = null;
      }, throttleDelay);
    } else {
      callback(event);
    }
  };
  
  element.addEventListener('scroll', handleScroll, { passive: true });
  
  return () => {
    element.removeEventListener('scroll', handleScroll);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
};

export const createInfiniteScroll = (callback, options = {}) => {
  const {
    threshold = 100,
    element = window,
    throttleDelay = 250
  } = options;
  
  let timeoutId;
  let isLoading = false;
  
  const handleScroll = () => {
    if (timeoutId || isLoading) return;
    
    timeoutId = setTimeout(async () => {
      const scrollPercent = getScrollPercent(element);
      
      if (scrollPercent >= (100 - threshold)) {
        isLoading = true;
        try {
          await callback();
        } finally {
          isLoading = false;
        }
      }
      
      timeoutId = null;
    }, throttleDelay);
  };
  
  const eventTarget = element === window ? window : element;
  eventTarget.addEventListener('scroll', handleScroll, { passive: true });
  
  return {
    destroy: () => {
      eventTarget.removeEventListener('scroll', handleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    },
    
    setLoading: (loading) => {
      isLoading = loading;
    },
    
    isLoading: () => isLoading
  };
};

export const saveScrollPosition = (key, element = window) => {
  const position = getScrollPosition(element);
  localStorage.setItem(`scroll-${key}`, JSON.stringify(position));
};

export const restoreScrollPosition = (key, element = window, smooth = false) => {
  try {
    const saved = localStorage.getItem(`scroll-${key}`);
    if (saved) {
      const position = JSON.parse(saved);
      setScrollPosition(position.x, position.y, { smooth, element });
      return true;
    }
  } catch (error) {
    console.error('Failed to restore scroll position:', error);
  }
  return false;
};

export const clearScrollPosition = (key) => {
  localStorage.removeItem(`scroll-${key}`);
};

export const isElementInViewport = (element, threshold = 0) => {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const verticalThreshold = windowHeight * threshold;
  const horizontalThreshold = windowWidth * threshold;
  
  return (
    rect.top >= -verticalThreshold &&
    rect.left >= -horizontalThreshold &&
    rect.bottom <= windowHeight + verticalThreshold &&
    rect.right <= windowWidth + horizontalThreshold
  );
};

export const getElementsInViewport = (elements, threshold = 0) => {
  return Array.from(elements).filter(element => 
    isElementInViewport(element, threshold)
  );
};

export const scrollIntoViewIfNeeded = (element, options = {}) => {
  if (!isElementInViewport(element)) {
    scrollToElement(element, options);
  }
};

export default {
  scrollToTop,
  scrollToBottom,
  scrollToElement,
  scrollToId,
  getScrollPosition,
  setScrollPosition,
  getScrollPercent,
  isScrolledToBottom,
  isScrolledToTop,
  getScrollDirection,
  createScrollSpy,
  smoothScrollTo,
  onScroll,
  onElementScroll,
  createInfiniteScroll,
  saveScrollPosition,
  restoreScrollPosition,
  clearScrollPosition,
  isElementInViewport,
  getElementsInViewport,
  scrollIntoViewIfNeeded
};
