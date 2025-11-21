/**
 * Simple event emitter for component communication
 */

class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    
    const index = this.events[event].indexOf(callback);
    if (index > -1) {
      this.events[event].splice(index, 1);
    }
  }

  emit(event, ...args) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error('Event callback error:', error);
      }
    });
  }

  once(event, callback) {
    const onceCallback = (...args) => {
      callback(...args);
      this.off(event, onceCallback);
    };
    
    this.on(event, onceCallback);
  }

  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }

  listenerCount(event) {
    return this.events[event] ? this.events[event].length : 0;
  }

  eventNames() {
    return Object.keys(this.events);
  }
}

// Global event emitter instance
const globalEmitter = new EventEmitter();

export const on = globalEmitter.on.bind(globalEmitter);
export const off = globalEmitter.off.bind(globalEmitter);
export const emit = globalEmitter.emit.bind(globalEmitter);
export const once = globalEmitter.once.bind(globalEmitter);
export const removeAllListeners = globalEmitter.removeAllListeners.bind(globalEmitter);
export const listenerCount = globalEmitter.listenerCount.bind(globalEmitter);
export const eventNames = globalEmitter.eventNames.bind(globalEmitter);

export { EventEmitter };

export default {
  EventEmitter,
  on,
  off,
  emit,
  once,
  removeAllListeners,
  listenerCount,
  eventNames
};
