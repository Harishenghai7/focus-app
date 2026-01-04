/**
 * Performance monitoring utility
 */

let metrics = new Map();
let observers = new Set();
let performanceObserver = null;

export const startTimer = (name) => {
  const startTime = performance.now();
  metrics.set(name, { startTime, endTime: null, duration: null, type: 'timer' });
  return name;
};

export const endTimer = (name) => {
  const metric = metrics.get(name);
  if (!metric || metric.type !== 'timer') {
    console.warn(`Timer '${name}' not found or not a timer`);
    return null;
  }
  
  const endTime = performance.now();
  const duration = endTime - metric.startTime;
  
  const completedMetric = {
    ...metric,
    endTime,
    duration,
    timestamp: Date.now()
  };
  
  metrics.set(name, completedMetric);
  notifyObservers('timer', name, completedMetric);
  
  return duration;
};

export const measureFunction = (fn, name) => {
  return (...args) => {
    const timerName = name || fn.name || 'anonymous';
    startTimer(timerName);
    
    try {
      const result = fn(...args);
      
      if (result && typeof result.then === 'function') {
        // Handle promise
        return result.finally(() => endTimer(timerName));
      } else {
        endTimer(timerName);
        return result;
      }
    } catch (error) {
      endTimer(timerName);
      throw error;
    }
  };
};

export const measureAsync = async (asyncFn, name) => {
  const timerName = name || asyncFn.name || 'async-function';
  startTimer(timerName);
  
  try {
    const result = await asyncFn();
    endTimer(timerName);
    return result;
  } catch (error) {
    endTimer(timerName);
    throw error;
  }
};

export const recordMetric = (name, value, type = 'custom', unit = 'ms') => {
  const metric = {
    name,
    value,
    type,
    unit,
    timestamp: Date.now()
  };
  
  metrics.set(name, metric);
  notifyObservers('metric', name, metric);
  
  return metric;
};

export const getMetric = (name) => {
  return metrics.get(name);
};

export const getAllMetrics = () => {
  return Object.fromEntries(metrics);
};

export const getMetricsByType = (type) => {
  const filtered = {};
  for (const [name, metric] of metrics) {
    if (metric.type === type) {
      filtered[name] = metric;
    }
  }
  return filtered;
};

export const clearMetric = (name) => {
  return metrics.delete(name);
};

export const clearAllMetrics = () => {
  metrics.clear();
};

export const getAverageMetric = (name, count = 10) => {
  const allMetrics = getAllMetrics();
  const matchingMetrics = Object.values(allMetrics)
    .filter(metric => metric.name === name && typeof metric.value === 'number')
    .slice(-count);
  
  if (matchingMetrics.length === 0) return null;
  
  const sum = matchingMetrics.reduce((acc, metric) => acc + metric.value, 0);
  return sum / matchingMetrics.length;
};

export const measureMemoryUsage = () => {
  if (performance.memory) {
    const memory = {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
      usedMB: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      totalMB: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limitMB: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
    };
    
    recordMetric('memory-usage', memory, 'memory', 'bytes');
    return memory;
  }
  
  return null;
};

export const measureNetworkTiming = () => {
  if (typeof navigator !== 'undefined' && navigator.connection) {
    const connection = navigator.connection;
    const network = {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
    
    recordMetric('network-info', network, 'network');
    return network;
  }
  
  return null;
};

export const measurePageLoad = () => {
  if (typeof window === 'undefined') return null;
  
  const navigation = performance.getEntriesByType('navigation')[0];
  if (!navigation) return null;
  
  const timing = {
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    request: navigation.responseStart - navigation.requestStart,
    response: navigation.responseEnd - navigation.responseStart,
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    domComplete: navigation.domComplete - navigation.navigationStart,
    loadComplete: navigation.loadEventEnd - navigation.navigationStart,
    firstPaint: 0,
    firstContentfulPaint: 0
  };
  
  // Get paint timings
  const paintEntries = performance.getEntriesByType('paint');
  paintEntries.forEach(entry => {
    if (entry.name === 'first-paint') {
      timing.firstPaint = entry.startTime;
    } else if (entry.name === 'first-contentful-paint') {
      timing.firstContentfulPaint = entry.startTime;
    }
  });
  
  recordMetric('page-load', timing, 'navigation', 'ms');
  return timing;
};

export const measureFPS = (duration = 1000) => {
  return new Promise((resolve) => {
    let frames = 0;
    let lastTime = performance.now();
    
    const measureFrame = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= duration) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        recordMetric('fps', fps, 'performance', 'fps');
        resolve(fps);
      } else {
        requestAnimationFrame(measureFrame);
      }
    };
    
    requestAnimationFrame(measureFrame);
  });
};

export const measureResourceTiming = (resourceName) => {
  const resources = performance.getEntriesByName(resourceName);
  if (resources.length === 0) return null;
  
  const resource = resources[resources.length - 1]; // Get the most recent
  const timing = {
    name: resource.name,
    duration: resource.duration,
    size: resource.transferSize || 0,
    dns: resource.domainLookupEnd - resource.domainLookupStart,
    tcp: resource.connectEnd - resource.connectStart,
    request: resource.responseStart - resource.requestStart,
    response: resource.responseEnd - resource.responseStart
  };
  
  recordMetric(`resource-${resourceName}`, timing, 'resource', 'ms');
  return timing;
};

export const startPerformanceObserver = () => {
  if (typeof window === 'undefined' || performanceObserver) return;
  
  try {
    performanceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const metric = {
          name: entry.name,
          type: entry.entryType,
          startTime: entry.startTime,
          duration: entry.duration,
          timestamp: Date.now()
        };
        
        metrics.set(`${entry.entryType}-${entry.name}`, metric);
        notifyObservers('observer', entry.name, metric);
      });
    });
    
    performanceObserver.observe({ 
      entryTypes: ['navigation', 'resource', 'paint', 'measure', 'mark'] 
    });
  } catch (error) {
    console.warn('Performance Observer not supported:', error);
  }
};

export const stopPerformanceObserver = () => {
  if (performanceObserver) {
    performanceObserver.disconnect();
    performanceObserver = null;
  }
};

export const mark = (name) => {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
  recordMetric(`mark-${name}`, performance.now(), 'mark', 'ms');
};

export const measure = (name, startMark, endMark) => {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name, 'measure');
      if (entries.length > 0) {
        const duration = entries[entries.length - 1].duration;
        recordMetric(`measure-${name}`, duration, 'measure', 'ms');
        return duration;
      }
    } catch (error) {
      console.warn('Performance measure failed:', error);
    }
  }
  return null;
};

export const onMetricRecorded = (callback) => {
  observers.add(callback);
  return () => observers.delete(callback);
};

export const removeMetricObserver = (callback) => {
  observers.delete(callback);
};

export const removeAllMetricObservers = () => {
  observers.clear();
};

const notifyObservers = (type, name, metric) => {
  observers.forEach(observer => {
    try {
      observer(type, name, metric);
    } catch (error) {
      console.error('Performance observer error:', error);
    }
  });
};

export const getPerformanceReport = () => {
  const allMetrics = getAllMetrics();
  const report = {
    timestamp: Date.now(),
    metrics: allMetrics,
    summary: {
      totalMetrics: Object.keys(allMetrics).length,
      memoryUsage: getMetric('memory-usage')?.value,
      networkInfo: getMetric('network-info')?.value,
      pageLoad: getMetric('page-load')?.value,
      fps: getMetric('fps')?.value
    }
  };
  
  return report;
};

export const exportMetrics = (format = 'json') => {
  const report = getPerformanceReport();
  
  switch (format) {
    case 'csv':
      return convertToCSV(report.metrics);
    case 'json':
    default:
      return JSON.stringify(report, null, 2);
  }
};

const convertToCSV = (metrics) => {
  const rows = [['Name', 'Type', 'Value', 'Unit', 'Timestamp']];
  
  Object.values(metrics).forEach(metric => {
    const value = typeof metric.value === 'object' 
      ? JSON.stringify(metric.value) 
      : metric.value;
    
    rows.push([
      metric.name,
      metric.type,
      value,
      metric.unit || '',
      metric.timestamp
    ]);
  });
  
  return rows.map(row => row.join(',')).join('\n');
};

// Auto-start performance observer if in browser
if (typeof window !== 'undefined') {
  startPerformanceObserver();
}

export default {
  startTimer,
  endTimer,
  measureFunction,
  measureAsync,
  recordMetric,
  getMetric,
  getAllMetrics,
  getMetricsByType,
  clearMetric,
  clearAllMetrics,
  getAverageMetric,
  measureMemoryUsage,
  measureNetworkTiming,
  measurePageLoad,
  measureFPS,
  measureResourceTiming,
  startPerformanceObserver,
  stopPerformanceObserver,
  mark,
  measure,
  onMetricRecorded,
  removeMetricObserver,
  removeAllMetricObservers,
  getPerformanceReport,
  exportMetrics
};
