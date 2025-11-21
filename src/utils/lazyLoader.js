/**
 * Lazy loading utility
 */

export const lazyLoad = (importFn, fallback = null) => {
  let componentPromise = null;
  
  return () => {
    if (!componentPromise) {
      componentPromise = importFn();
    }
    return componentPromise;
  };
};

export const createLazyLoader = () => {
  const cache = new Map();
  
  return {
    load: (key, importFn) => {
      if (!cache.has(key)) {
        cache.set(key, importFn());
      }
      return cache.get(key);
    },
    
    preload: (key, importFn) => {
      if (!cache.has(key)) {
        cache.set(key, importFn());
      }
    },
    
    clear: (key) => {
      if (key) {
        cache.delete(key);
      } else {
        cache.clear();
      }
    },
    
    has: (key) => {
      return cache.has(key);
    },
    
    size: () => {
      return cache.size;
    }
  };
};

export const lazyImage = (src, options = {}) => {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4='
  } = options;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    
    // Use Intersection Observer if available
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              img.src = src;
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin, threshold }
      );
      
      // Create a temporary element to observe
      const tempDiv = document.createElement('div');
      tempDiv.style.height = '1px';
      document.body.appendChild(tempDiv);
      observer.observe(tempDiv);
      
      // Clean up
      img.onload = () => {
        document.body.removeChild(tempDiv);
        resolve(img);
      };
      img.onerror = () => {
        document.body.removeChild(tempDiv);
        reject(new Error(`Failed to load image: ${src}`));
      };
    } else {
      // Fallback: load immediately
      img.src = src;
    }
  });
};

export const createImageLazyLoader = (options = {}) => {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    errorImage = null,
    loadingClass = 'lazy-loading',
    loadedClass = 'lazy-loaded',
    errorClass = 'lazy-error'
  } = options;
  
  const imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          
          if (src) {
            img.classList.add(loadingClass);
            
            const tempImg = new Image();
            tempImg.onload = () => {
              img.src = src;
              img.classList.remove(loadingClass);
              img.classList.add(loadedClass);
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            };
            
            tempImg.onerror = () => {
              img.classList.remove(loadingClass);
              img.classList.add(errorClass);
              if (errorImage) {
                img.src = errorImage;
              }
              imageObserver.unobserve(img);
            };
            
            tempImg.src = src;
          }
        }
      });
    },
    { rootMargin, threshold }
  );
  
  return {
    observe: (img) => {
      imageObserver.observe(img);
    },
    
    unobserve: (img) => {
      imageObserver.unobserve(img);
    },
    
    disconnect: () => {
      imageObserver.disconnect();
    },
    
    observeAll: (selector = 'img[data-src]') => {
      const images = document.querySelectorAll(selector);
      images.forEach(img => imageObserver.observe(img));
    }
  };
};

export const lazyScript = (src, options = {}) => {
  const {
    async = true,
    defer = false,
    type = 'text/javascript',
    integrity = null,
    crossorigin = null
  } = options;
  
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      resolve(existingScript);
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.defer = defer;
    script.type = type;
    
    if (integrity) script.integrity = integrity;
    if (crossorigin) script.crossOrigin = crossorigin;
    
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    
    document.head.appendChild(script);
  });
};

export const lazyCSS = (href, options = {}) => {
  const {
    media = 'all',
    integrity = null,
    crossorigin = null
  } = options;
  
  return new Promise((resolve, reject) => {
    // Check if stylesheet is already loaded
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) {
      resolve(existingLink);
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = media;
    
    if (integrity) link.integrity = integrity;
    if (crossorigin) link.crossOrigin = crossorigin;
    
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
    
    document.head.appendChild(link);
  });
};

export const lazyModule = (modulePath) => {
  return () => import(modulePath);
};

export const createModuleLazyLoader = () => {
  const moduleCache = new Map();
  
  return {
    load: async (key, modulePath) => {
      if (moduleCache.has(key)) {
        return moduleCache.get(key);
      }
      
      try {
        const module = await import(modulePath);
        moduleCache.set(key, module);
        return module;
      } catch (error) {
        console.error(`Failed to load module ${modulePath}:`, error);
        throw error;
      }
    },
    
    preload: (key, modulePath) => {
      if (!moduleCache.has(key)) {
        import(modulePath)
          .then(module => moduleCache.set(key, module))
          .catch(error => console.error(`Failed to preload module ${modulePath}:`, error));
      }
    },
    
    has: (key) => moduleCache.has(key),
    
    clear: (key) => {
      if (key) {
        moduleCache.delete(key);
      } else {
        moduleCache.clear();
      }
    }
  };
};

export const lazyContent = (element, loadFn, options = {}) => {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    once = true
  } = options;
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadFn(entry.target);
          if (once) {
            observer.unobserve(entry.target);
          }
        }
      });
    },
    { rootMargin, threshold }
  );
  
  if (element) {
    observer.observe(element);
  }
  
  return {
    observe: (el) => observer.observe(el),
    unobserve: (el) => observer.unobserve(el),
    disconnect: () => observer.disconnect()
  };
};

export const createContentLazyLoader = (options = {}) => {
  const {
    rootMargin = '50px',
    threshold = 0.1
  } = options;
  
  const loadingStates = new WeakMap();
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const state = loadingStates.get(element);
          
          if (state && state.loadFn && !state.loaded) {
            state.loaded = true;
            state.loadFn(element);
            
            if (state.once) {
              observer.unobserve(element);
              loadingStates.delete(element);
            }
          }
        }
      });
    },
    { rootMargin, threshold }
  );
  
  return {
    register: (element, loadFn, once = true) => {
      loadingStates.set(element, { loadFn, once, loaded: false });
      observer.observe(element);
    },
    
    unregister: (element) => {
      observer.unobserve(element);
      loadingStates.delete(element);
    },
    
    disconnect: () => {
      observer.disconnect();
      loadingStates.clear();
    },
    
    isRegistered: (element) => {
      return loadingStates.has(element);
    },
    
    isLoaded: (element) => {
      const state = loadingStates.get(element);
      return state ? state.loaded : false;
    }
  };
};

export const preloadResource = (url, type = 'fetch', options = {}) => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    
    switch (type) {
      case 'image':
        link.as = 'image';
        break;
      case 'script':
        link.as = 'script';
        break;
      case 'style':
        link.as = 'style';
        break;
      case 'font':
        link.as = 'font';
        link.crossOrigin = 'anonymous';
        break;
      default:
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
    }
    
    if (options.type) link.type = options.type;
    if (options.crossorigin) link.crossOrigin = options.crossorigin;
    
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`Failed to preload resource: ${url}`));
    
    document.head.appendChild(link);
  });
};

export const batchPreload = (resources) => {
  const promises = resources.map(resource => {
    if (typeof resource === 'string') {
      return preloadResource(resource);
    } else {
      return preloadResource(resource.url, resource.type, resource.options);
    }
  });
  
  return Promise.allSettled(promises);
};

export default {
  lazyLoad,
  createLazyLoader,
  lazyImage,
  createImageLazyLoader,
  lazyScript,
  lazyCSS,
  lazyModule,
  createModuleLazyLoader,
  lazyContent,
  createContentLazyLoader,
  preloadResource,
  batchPreload
};
