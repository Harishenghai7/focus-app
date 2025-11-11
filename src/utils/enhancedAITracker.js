/**
 * Enhanced AI Tracker - Comprehensive monitoring with error/bug detection
 */

import { aiTracker } from './aiTracker';
import * as Sentry from '@sentry/react';

class EnhancedAITracker {
  constructor() {
    this.errorPatterns = new Map();
    this.bugReports = [];
    this.performanceIssues = [];
    this.userFrustrationScore = 0;
    this.actionSequence = [];
    this.errorThreshold = 3;
    this.init();
  }

  init() {
    this.setupAdvancedListeners();
    this.startErrorAnalysis();
    this.monitorPerformance();
    this.detectUserFrustration();
  }

  setupAdvancedListeners() {
    // Enhanced click tracking with error detection
    document.addEventListener('click', (e) => {
      this.trackEnhancedClick(e);
      this.detectClickErrors(e);
    }, true);

    // Form error detection
    document.addEventListener('submit', (e) => {
      this.trackFormSubmission(e);
    }, true);

    // Input validation errors
    document.addEventListener('invalid', (e) => {
      this.trackValidationError(e);
    }, true);

    // Network request monitoring
    this.interceptNetworkRequests();

    // Console error monitoring
    this.interceptConsoleErrors();

    // Promise rejection tracking
    window.addEventListener('unhandledrejection', (e) => {
      this.trackPromiseRejection(e);
    });

    // Resource loading errors
    window.addEventListener('error', (e) => {
      this.trackResourceError(e);
    }, true);

    // React error boundary integration
    this.setupReactErrorTracking();
  }

  trackEnhancedClick(event) {
    const element = event.target;
    const clickData = {
      type: 'enhanced_click',
      timestamp: Date.now(),
      element: this.getDetailedElementInfo(element),
      coordinates: { x: event.clientX, y: event.clientY },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      path: this.getFullElementPath(element),
      context: this.getClickContext(element),
      userState: this.getUserState(),
      sessionId: aiTracker.sessionId
    };

    // Track with original AI tracker
    aiTracker.trackCustomEvent('enhanced_click', clickData);
    
    // Add to action sequence for pattern analysis
    this.actionSequence.push(clickData);
    this.analyzeActionPattern();
  }

  detectClickErrors(event) {
    const element = event.target;
    
    // Detect broken links
    if (element.tagName === 'A' && element.href) {
      this.validateLink(element.href, element);
    }

    // Detect non-functional buttons
    if (element.tagName === 'BUTTON' || element.role === 'button') {
      this.validateButtonFunctionality(element);
    }

    // Detect missing click handlers
    if (element.style.cursor === 'pointer' && !this.hasClickHandler(element)) {
      this.reportBug('missing_click_handler', {
        element: this.getDetailedElementInfo(element),
        severity: 'medium'
      });
    }
  }

  trackFormSubmission(event) {
    const form = event.target;
    const formData = new FormData(form);
    const fields = {};
    
    for (let [key, value] of formData.entries()) {
      fields[key] = typeof value === 'string' ? value.length : 'file';
    }

    const submissionData = {
      formId: form.id,
      action: form.action,
      method: form.method,
      fieldCount: Object.keys(fields).length,
      fields,
      timestamp: Date.now()
    };

    aiTracker.trackCustomEvent('form_submission', submissionData);
    
    // Monitor for submission errors
    setTimeout(() => {
      this.checkFormSubmissionResult(form, submissionData);
    }, 2000);
  }

  trackValidationError(event) {
    const element = event.target;
    const errorData = {
      type: 'validation_error',
      field: element.name || element.id,
      value: element.value?.length || 0,
      validationMessage: element.validationMessage,
      element: this.getDetailedElementInfo(element),
      timestamp: Date.now()
    };

    aiTracker.trackCustomEvent('validation_error', errorData);
    this.incrementFrustrationScore(2);
  }

  interceptNetworkRequests() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        
        this.trackNetworkRequest({
          url,
          method: args[1]?.method || 'GET',
          status: response.status,
          duration,
          success: response.ok,
          timestamp: Date.now()
        });

        if (!response.ok) {
          this.reportNetworkError(response, url, duration);
        }

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.trackNetworkRequest({
          url,
          method: args[1]?.method || 'GET',
          error: error.message,
          duration,
          success: false,
          timestamp: Date.now()
        });
        
        this.reportNetworkError(error, url, duration);
        throw error;
      }
    };
  }

  interceptConsoleErrors() {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      this.trackConsoleError('error', args);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      this.trackConsoleError('warn', args);
      originalWarn.apply(console, args);
    };
  }

  trackConsoleError(level, args) {
    const errorData = {
      type: 'console_error',
      level,
      message: args.join(' '),
      stack: new Error().stack,
      timestamp: Date.now(),
      url: window.location.href
    };

    aiTracker.trackCustomEvent('console_error', errorData);
    
    if (level === 'error') {
      this.analyzeErrorPattern(errorData);
    }
  }

  trackPromiseRejection(event) {
    const errorData = {
      type: 'promise_rejection',
      reason: event.reason?.toString(),
      stack: event.reason?.stack,
      timestamp: Date.now(),
      url: window.location.href
    };

    aiTracker.trackCustomEvent('promise_rejection', errorData);
    this.reportBug('unhandled_promise_rejection', errorData);
  }

  trackResourceError(event) {
    if (event.target !== window) {
      const errorData = {
        type: 'resource_error',
        tagName: event.target.tagName,
        src: event.target.src || event.target.href,
        message: event.message,
        timestamp: Date.now()
      };

      aiTracker.trackCustomEvent('resource_error', errorData);
      this.reportBug('resource_load_failure', errorData);
    }
  }

  setupReactErrorTracking() {
    // React error tracking will be handled by error boundaries
    window.addEventListener('error', (event) => {
      if (event.error && event.error.stack && event.error.stack.includes('React')) {
        const errorData = {
          type: 'react_error',
          error: event.error.toString(),
          stack: event.error.stack,
          timestamp: Date.now()
        };

        aiTracker.trackCustomEvent('react_error', errorData);
        this.reportBug('react_component_error', errorData);
      }
    });
  }

  analyzeErrorPattern(errorData) {
    const errorKey = this.generateErrorKey(errorData);
    const pattern = this.errorPatterns.get(errorKey) || { count: 0, firstSeen: Date.now() };
    
    pattern.count++;
    pattern.lastSeen = Date.now();
    
    this.errorPatterns.set(errorKey, pattern);
    
    // Report if error occurs frequently
    if (pattern.count >= this.errorThreshold) {
      this.reportBug('recurring_error', {
        errorKey,
        pattern,
        originalError: errorData,
        severity: 'high'
      });
    }
  }

  analyzeActionPattern() {
    if (this.actionSequence.length < 5) return;
    
    const recent = this.actionSequence.slice(-5);
    
    // Detect rapid clicking (potential frustration)
    const rapidClicks = recent.filter(action => 
      action.type === 'enhanced_click' && 
      Date.now() - action.timestamp < 5000
    );
    
    if (rapidClicks.length >= 4) {
      this.incrementFrustrationScore(5);
      this.reportBug('user_frustration_rapid_clicking', {
        clicks: rapidClicks.length,
        timespan: 5000,
        severity: 'medium'
      });
    }

    // Detect repeated failed actions
    const failedActions = recent.filter(action => action.failed);
    if (failedActions.length >= 3) {
      this.reportBug('repeated_failed_actions', {
        actions: failedActions,
        severity: 'high'
      });
    }
  }

  detectUserFrustration() {
    setInterval(() => {
      if (this.userFrustrationScore > 10) {
        this.reportBug('high_user_frustration', {
          score: this.userFrustrationScore,
          recentActions: this.actionSequence.slice(-10),
          severity: 'high'
        });
        
        // Reset score after reporting
        this.userFrustrationScore = Math.max(0, this.userFrustrationScore - 5);
      } else {
        // Gradually decrease frustration score
        this.userFrustrationScore = Math.max(0, this.userFrustrationScore - 1);
      }
    }, 10000); // Check every 10 seconds
  }

  monitorPerformance() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // Long task threshold
            this.reportPerformanceIssue('long_task', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.9) {
          this.reportPerformanceIssue('high_memory_usage', {
            used: memory.usedJSHeapSize,
            limit: memory.jsHeapSizeLimit,
            percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  reportBug(type, data) {
    const bugReport = {
      id: `bug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      sessionId: aiTracker.sessionId,
      userId: aiTracker.userId,
      severity: data.severity || 'medium'
    };

    this.bugReports.push(bugReport);
    
    // Send to AI tracker
    aiTracker.trackCustomEvent('bug_report', bugReport);
    
    // Send to Sentry for critical bugs
    if (bugReport.severity === 'high') {
      Sentry.captureException(new Error(`Bug Report: ${type}`), {
        extra: bugReport
      });
    }

    // Auto-send bug reports
    this.sendBugReport(bugReport);
  }

  reportPerformanceIssue(type, data) {
    const issue = {
      type,
      data,
      timestamp: Date.now(),
      url: window.location.href
    };

    this.performanceIssues.push(issue);
    aiTracker.trackCustomEvent('performance_issue', issue);
  }

  // Utility methods
  getDetailedElementInfo(element) {
    return {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      textContent: element.textContent?.substring(0, 100),
      attributes: this.getAllAttributes(element),
      computedStyle: this.getRelevantStyles(element),
      boundingRect: element.getBoundingClientRect()
    };
  }

  getFullElementPath(element) {
    const path = [];
    let current = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) selector += `#${current.id}`;
      if (current.className) selector += `.${current.className.split(' ').join('.')}`;
      
      // Add position if multiple siblings
      const siblings = Array.from(current.parentNode?.children || []);
      const sameTag = siblings.filter(s => s.tagName === current.tagName);
      if (sameTag.length > 1) {
        const index = sameTag.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }

  getClickContext(element) {
    return {
      isVisible: this.isElementVisible(element),
      isClickable: this.isElementClickable(element),
      hasEventListeners: this.hasClickHandler(element),
      parentForm: element.closest('form')?.id,
      nearbyElements: this.getNearbyElements(element)
    };
  }

  getUserState() {
    return {
      scrollPosition: { x: window.scrollX, y: window.scrollY },
      focusedElement: document.activeElement?.tagName,
      selectionText: window.getSelection()?.toString().substring(0, 50),
      frustrationScore: this.userFrustrationScore
    };
  }

  incrementFrustrationScore(points) {
    this.userFrustrationScore += points;
  }

  async sendBugReport(bugReport) {
    try {
      await fetch('/api/bug-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bugReport)
      });
    } catch (error) {
      console.warn('Failed to send bug report:', error);
    }
  }

  // Helper methods
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && 
           rect.top >= 0 && rect.left >= 0 &&
           rect.bottom <= window.innerHeight && 
           rect.right <= window.innerWidth;
  }

  isElementClickable(element) {
    const style = window.getComputedStyle(element);
    return style.pointerEvents !== 'none' && 
           style.visibility !== 'hidden' && 
           style.display !== 'none';
  }

  hasClickHandler(element) {
    return element.onclick !== null || 
           element.addEventListener !== undefined ||
           element.getAttribute('onclick') !== null;
  }

  getAllAttributes(element) {
    const attrs = {};
    for (let attr of element.attributes) {
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }

  getRelevantStyles(element) {
    const style = window.getComputedStyle(element);
    return {
      display: style.display,
      visibility: style.visibility,
      pointerEvents: style.pointerEvents,
      cursor: style.cursor,
      position: style.position
    };
  }

  getNearbyElements(element) {
    const rect = element.getBoundingClientRect();
    const nearby = document.elementsFromPoint(rect.left + 50, rect.top + 50);
    return nearby.slice(0, 3).map(el => ({
      tagName: el.tagName,
      id: el.id,
      className: el.className
    }));
  }

  generateErrorKey(errorData) {
    return `${errorData.type}_${errorData.message?.substring(0, 50)}`;
  }

  // Public API
  getBugReports() {
    return this.bugReports;
  }

  getPerformanceIssues() {
    return this.performanceIssues;
  }

  getFrustrationScore() {
    return this.userFrustrationScore;
  }

  getErrorPatterns() {
    return Object.fromEntries(this.errorPatterns);
  }
}

export const enhancedAITracker = new EnhancedAITracker();
export default enhancedAITracker;