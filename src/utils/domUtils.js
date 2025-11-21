/**
 * DOM manipulation utilities
 */

export const createElement = (tag, attributes = {}, children = []) => {
  const element = document.createElement(tag);
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('data-')) {
      element.setAttribute(key, value);
    } else if (key.startsWith('aria-')) {
      element.setAttribute(key, value);
    } else if (key in element) {
      element[key] = value;
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Add children
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
  
  return element;
};

export const createElementFromString = (htmlString) => {
  const template = document.createElement('template');
  template.innerHTML = htmlString.trim();
  return template.content.firstChild;
};

export const addClass = (element, ...classNames) => {
  if (!element) return;
  element.classList.add(...classNames);
};

export const removeClass = (element, ...classNames) => {
  if (!element) return;
  element.classList.remove(...classNames);
};

export const toggleClass = (element, className, force) => {
  if (!element) return false;
  return element.classList.toggle(className, force);
};

export const hasClass = (element, className) => {
  if (!element) return false;
  return element.classList.contains(className);
};

export const setStyle = (element, styles) => {
  if (!element) return;
  
  if (typeof styles === 'object') {
    Object.assign(element.style, styles);
  } else if (typeof styles === 'string') {
    element.style.cssText = styles;
  }
};

export const getStyle = (element, property) => {
  if (!element) return null;
  return window.getComputedStyle(element).getPropertyValue(property);
};

export const show = (element, display = 'block') => {
  if (!element) return;
  element.style.display = display;
};

export const hide = (element) => {
  if (!element) return;
  element.style.display = 'none';
};

export const toggle = (element, display = 'block') => {
  if (!element) return;
  
  if (element.style.display === 'none' || !element.style.display) {
    show(element, display);
  } else {
    hide(element);
  }
};

export const isVisible = (element) => {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0';
};

export const isInViewport = (element) => {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

export const getElementPosition = (element) => {
  if (!element) return { top: 0, left: 0 };
  
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset,
    width: rect.width,
    height: rect.height
  };
};

export const getElementSize = (element) => {
  if (!element) return { width: 0, height: 0 };
  
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height
  };
};

export const setAttributes = (element, attributes) => {
  if (!element) return;
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      element.removeAttribute(key);
    } else {
      element.setAttribute(key, value);
    }
  });
};

export const getAttributes = (element) => {
  if (!element) return {};
  
  const attributes = {};
  Array.from(element.attributes).forEach(attr => {
    attributes[attr.name] = attr.value;
  });
  
  return attributes;
};

export const removeAttributes = (element, ...attributeNames) => {
  if (!element) return;
  
  attributeNames.forEach(name => {
    element.removeAttribute(name);
  });
};

export const insertAfter = (newElement, referenceElement) => {
  if (!newElement || !referenceElement || !referenceElement.parentNode) return;
  
  referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
};

export const insertBefore = (newElement, referenceElement) => {
  if (!newElement || !referenceElement || !referenceElement.parentNode) return;
  
  referenceElement.parentNode.insertBefore(newElement, referenceElement);
};

export const wrap = (element, wrapper) => {
  if (!element || !wrapper) return;
  
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);
};

export const unwrap = (element) => {
  if (!element || !element.parentNode) return;
  
  const parent = element.parentNode;
  const grandParent = parent.parentNode;
  
  if (grandParent) {
    grandParent.insertBefore(element, parent);
    grandParent.removeChild(parent);
  }
};

export const empty = (element) => {
  if (!element) return;
  
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

export const remove = (element) => {
  if (!element || !element.parentNode) return;
  element.parentNode.removeChild(element);
};

export const clone = (element, deep = true) => {
  if (!element) return null;
  return element.cloneNode(deep);
};

export const closest = (element, selector) => {
  if (!element) return null;
  
  if (element.closest) {
    return element.closest(selector);
  }
  
  // Polyfill for older browsers
  let el = element;
  while (el && el.nodeType === 1) {
    if (matches(el, selector)) {
      return el;
    }
    el = el.parentElement;
  }
  
  return null;
};

export const matches = (element, selector) => {
  if (!element) return false;
  
  if (element.matches) {
    return element.matches(selector);
  }
  
  // Polyfill for older browsers
  const matches = element.webkitMatchesSelector ||
                 element.mozMatchesSelector ||
                 element.msMatchesSelector ||
                 element.oMatchesSelector;
  
  return matches ? matches.call(element, selector) : false;
};

export const siblings = (element) => {
  if (!element || !element.parentNode) return [];
  
  return Array.from(element.parentNode.children).filter(child => child !== element);
};

export const next = (element, selector) => {
  if (!element) return null;
  
  let sibling = element.nextElementSibling;
  
  if (!selector) return sibling;
  
  while (sibling) {
    if (matches(sibling, selector)) {
      return sibling;
    }
    sibling = sibling.nextElementSibling;
  }
  
  return null;
};

export const prev = (element, selector) => {
  if (!element) return null;
  
  let sibling = element.previousElementSibling;
  
  if (!selector) return sibling;
  
  while (sibling) {
    if (matches(sibling, selector)) {
      return sibling;
    }
    sibling = sibling.previousElementSibling;
  }
  
  return null;
};

export const parent = (element, selector) => {
  if (!element) return null;
  
  let parentEl = element.parentElement;
  
  if (!selector) return parentEl;
  
  while (parentEl) {
    if (matches(parentEl, selector)) {
      return parentEl;
    }
    parentEl = parentEl.parentElement;
  }
  
  return null;
};

export const children = (element, selector) => {
  if (!element) return [];
  
  const childElements = Array.from(element.children);
  
  if (!selector) return childElements;
  
  return childElements.filter(child => matches(child, selector));
};

export const find = (element, selector) => {
  if (!element) return null;
  return element.querySelector(selector);
};

export const findAll = (element, selector) => {
  if (!element) return [];
  return Array.from(element.querySelectorAll(selector));
};

export const on = (element, eventType, handler, options) => {
  if (!element) return;
  
  element.addEventListener(eventType, handler, options);
  
  return () => element.removeEventListener(eventType, handler, options);
};

export const off = (element, eventType, handler, options) => {
  if (!element) return;
  element.removeEventListener(eventType, handler, options);
};

export const once = (element, eventType, handler, options) => {
  if (!element) return;
  
  const onceHandler = (event) => {
    handler(event);
    element.removeEventListener(eventType, onceHandler, options);
  };
  
  element.addEventListener(eventType, onceHandler, options);
  
  return () => element.removeEventListener(eventType, onceHandler, options);
};

export const trigger = (element, eventType, detail = null) => {
  if (!element) return;
  
  const event = new CustomEvent(eventType, {
    bubbles: true,
    cancelable: true,
    detail
  });
  
  return element.dispatchEvent(event);
};

export const delegate = (container, selector, eventType, handler) => {
  if (!container) return;
  
  const delegateHandler = (event) => {
    const target = event.target.closest(selector);
    if (target && container.contains(target)) {
      handler.call(target, event);
    }
  };
  
  container.addEventListener(eventType, delegateHandler);
  
  return () => container.removeEventListener(eventType, delegateHandler);
};

export const ready = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
};

export const loaded = (callback) => {
  if (document.readyState === 'complete') {
    callback();
  } else {
    window.addEventListener('load', callback);
  }
};

export const whenVisible = (element, callback, options = {}) => {
  if (!element) return;
  
  const { threshold = 0, rootMargin = '0px', once = true } = options;
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target);
          if (once) {
            observer.unobserve(entry.target);
          }
        }
      });
    },
    { threshold, rootMargin }
  );
  
  observer.observe(element);
  
  return () => observer.unobserve(element);
};

export default {
  createElement,
  createElementFromString,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  setStyle,
  getStyle,
  show,
  hide,
  toggle,
  isVisible,
  isInViewport,
  getElementPosition,
  getElementSize,
  setAttributes,
  getAttributes,
  removeAttributes,
  insertAfter,
  insertBefore,
  wrap,
  unwrap,
  empty,
  remove,
  clone,
  closest,
  matches,
  siblings,
  next,
  prev,
  parent,
  children,
  find,
  findAll,
  on,
  off,
  once,
  trigger,
  delegate,
  ready,
  loaded,
  whenVisible
};
