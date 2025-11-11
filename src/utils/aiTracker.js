/**
 * AI-Powered User Behavior Tracking System
 * Tracks all user interactions, clicks, and responses with intelligent analysis
 */

class AITracker {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.events = [];
    this.patterns = new Map();
    this.heatmapData = new Map();
    this.performanceMetrics = new Map();
    this.aiInsights = [];
    this.isTracking = true;
    this.sessionStart = Date.now();
    
    this.init();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  init() {
    this.setupGlobalListeners();
    this.startPerformanceMonitoring();
    this.initializeAIAnalysis();
  }

  // Track all user interactions
  setupGlobalListeners() {
    // Click tracking
    document.addEventListener('click', (e) => this.trackClick(e), true);
    
    // Scroll tracking
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => this.trackScroll(), 100);
    });
    
    // Form interactions
    document.addEventListener('input', (e) => this.trackInput(e), true);
    document.addEventListener('submit', (e) => this.trackFormSubmit(e), true);
    
    // Navigation tracking
    window.addEventListener('popstate', (e) => this.trackNavigation(e));
    
    // Mouse movement heatmap
    let mouseMoveTimeout;
    document.addEventListener('mousemove', (e) => {
      clearTimeout(mouseMoveTimeout);
      mouseMoveTimeout = setTimeout(() => this.trackMouseMove(e), 50);
    });
    
    // Keyboard interactions
    document.addEventListener('keydown', (e) => this.trackKeyboard(e), true);
    
    // Focus/blur events
    document.addEventListener('focus', (e) => this.trackFocus(e), true);
    document.addEventListener('blur', (e) => this.trackBlur(e), true);
    
    // Visibility changes
    document.addEventListener('visibilitychange', () => this.trackVisibilityChange());
    
    // Error tracking
    window.addEventListener('error', (e) => this.trackError(e));
    window.addEventListener('unhandledrejection', (e) => this.trackPromiseRejection(e));
  }

  trackClick(event) {
    const element = event.target;
    const eventData = {
      type: 'click',
      timestamp: Date.now(),
      element: this.getElementInfo(element),
      coordinates: { x: event.clientX, y: event.clientY },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      path: this.getElementPath(element),
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    this.recordEvent(eventData);
    this.updateHeatmap(event.clientX, event.clientY, 'click');
    this.analyzeClickPattern(eventData);
  }

  trackScroll() {
    const eventData = {
      type: 'scroll',
      timestamp: Date.now(),
      scrollY: window.scrollY,
      scrollX: window.scrollX,
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      scrollPercentage: (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100,
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    this.recordEvent(eventData);
    this.analyzeScrollBehavior(eventData);
  }

  trackInput(event) {
    const element = event.target;
    const eventData = {
      type: 'input',
      timestamp: Date.now(),
      element: this.getElementInfo(element),
      inputType: element.type,
      valueLength: element.value?.length || 0,
      placeholder: element.placeholder,
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    this.recordEvent(eventData);
    this.analyzeInputBehavior(eventData);
  }

  trackFormSubmit(event) {
    const form = event.target;
    const eventData = {
      type: 'form_submit',
      timestamp: Date.now(),
      formId: form.id,
      formClass: form.className,
      fieldCount: form.elements.length,
      action: form.action,
      method: form.method,
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    this.recordEvent(eventData);
    this.analyzeFormCompletion(eventData);
  }

  trackNavigation(event) {
    const eventData = {
      type: 'navigation',
      timestamp: Date.now(),
      url: window.location.href,
      pathname: window.location.pathname,
      referrer: document.referrer,
      state: event.state,
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    this.recordEvent(eventData);
    this.analyzeNavigationPattern(eventData);
  }

  trackMouseMove(event) {
    this.updateHeatmap(event.clientX, event.clientY, 'hover');
  }

  trackKeyboard(event) {
    const eventData = {
      type: 'keyboard',
      timestamp: Date.now(),
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      element: this.getElementInfo(event.target),
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    this.recordEvent(eventData);
  }

  trackFocus(event) {
    const eventData = {
      type: 'focus',
      timestamp: Date.now(),
      element: this.getElementInfo(event.target),
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    this.recordEvent(eventData);
  }

  trackBlur(event) {
    const eventData = {
      type: 'blur',
      timestamp: Date.now(),
      element: this.getElementInfo(event.target),
      timeSpent: this.calculateTimeSpent(event.target),
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    this.recordEvent(eventData);
  }

  trackVisibilityChange() {
    const eventData = {
      type: 'visibility_change',
      timestamp: Date.now(),
      hidden: document.hidden,
      visibilityState: document.visibilityState,
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    this.recordEvent(eventData);
  }

  trackError(event) {
    const eventData = {
      type: 'error',
      timestamp: Date.now(),
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    this.recordEvent(eventData);
  }

  trackPromiseRejection(event) {
    const eventData = {
      type: 'promise_rejection',
      timestamp: Date.now(),
      reason: event.reason?.toString(),
      stack: event.reason?.stack,
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    this.recordEvent(eventData);
  }

  // Custom event tracking for app-specific actions
  trackCustomEvent(eventName, data = {}) {
    const eventData = {
      type: 'custom',
      eventName,
      timestamp: Date.now(),
      data,
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    this.recordEvent(eventData);
  }

  // Performance monitoring
  startPerformanceMonitoring() {
    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        this.trackPerformance('page_load', {
          loadTime: perfData.loadEventEnd - perfData.loadEventStart,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          firstPaint: this.getFirstPaint(),
          firstContentfulPaint: this.getFirstContentfulPaint()
        });
      }, 0);
    });

    // Track resource performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        this.trackPerformance('resource', {
          name: entry.name,
          duration: entry.duration,
          size: entry.transferSize,
          type: entry.initiatorType
        });
      });
    });
    observer.observe({ entryTypes: ['resource'] });
  }

  trackPerformance(type, data) {
    const eventData = {
      type: 'performance',
      performanceType: type,
      timestamp: Date.now(),
      data,
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    this.recordEvent(eventData);
  }

  // AI Analysis Methods
  initializeAIAnalysis() {
    // Run AI analysis every 30 seconds
    setInterval(() => {
      this.runAIAnalysis();
    }, 30000);
  }

  runAIAnalysis() {
    this.analyzeUserBehaviorPatterns();
    this.detectAnomalies();
    this.generateInsights();
    this.optimizeUserExperience();
  }

  analyzeUserBehaviorPatterns() {
    const recentEvents = this.events.slice(-100);
    
    // Analyze click patterns
    const clickEvents = recentEvents.filter(e => e.type === 'click');
    const clickPattern = this.detectClickPattern(clickEvents);
    
    // Analyze navigation patterns
    const navEvents = recentEvents.filter(e => e.type === 'navigation');
    const navPattern = this.detectNavigationPattern(navEvents);
    
    // Analyze engagement patterns
    const engagementScore = this.calculateEngagementScore(recentEvents);
    
    this.patterns.set('clicks', clickPattern);
    this.patterns.set('navigation', navPattern);
    this.patterns.set('engagement', engagementScore);
  }

  detectClickPattern(clickEvents) {
    const elements = clickEvents.map(e => e.element.tagName);
    const frequency = {};
    
    elements.forEach(el => {
      frequency[el] = (frequency[el] || 0) + 1;
    });
    
    return {
      mostClicked: Object.keys(frequency).sort((a, b) => frequency[b] - frequency[a])[0],
      clickFrequency: frequency,
      averageClicksPerMinute: clickEvents.length / 5, // Last 5 minutes
      hotspots: []
    };
  }

  detectNavigationPattern(navEvents) {
    const pages = navEvents.map(e => e.pathname);
    const sequence = this.findCommonSequences(pages);
    
    return {
      commonPaths: sequence,
      bounceRate: 0,
      averageSessionDuration: 0,
      exitPages: []
    };
  }

  calculateEngagementScore(events) {
    const weights = {
      click: 1,
      scroll: 0.5,
      input: 2,
      form_submit: 5,
      custom: 3
    };
    
    let score = 0;
    events.forEach(event => {
      score += weights[event.type] || 0;
    });
    
    return {
      score,
      level: score > 50 ? 'high' : score > 20 ? 'medium' : 'low',
      timeSpent: Date.now() - this.sessionStart,
      interactions: events.length
    };
  }

  detectAnomalies() {
    const recentEvents = this.events.slice(-50);
    const anomalies = [];
    
    // Detect rapid clicking (potential bot behavior)
    const rapidClicks = this.detectRapidClicking(recentEvents);
    if (rapidClicks.detected) {
      anomalies.push({
        type: 'rapid_clicking',
        severity: 'medium',
        data: rapidClicks
      });
    }
    
    // Detect unusual navigation patterns
    const unusualNav = this.detectUnusualNavigation(recentEvents);
    if (unusualNav.detected) {
      anomalies.push({
        type: 'unusual_navigation',
        severity: 'low',
        data: unusualNav
      });
    }
    
    // Detect error spikes
    const errorSpike = this.detectErrorSpike(recentEvents);
    if (errorSpike.detected) {
      anomalies.push({
        type: 'error_spike',
        severity: 'high',
        data: errorSpike
      });
    }
    
    if (anomalies.length > 0) {
      this.handleAnomalies(anomalies);
    }
  }

  generateInsights() {
    const insights = [];
    
    // User experience insights
    const uxInsights = this.generateUXInsights();
    insights.push(...uxInsights);
    
    // Performance insights
    const perfInsights = this.generatePerformanceInsights();
    insights.push(...perfInsights);
    
    // Feature usage insights
    const featureInsights = this.generateFeatureUsageInsights();
    insights.push(...featureInsights);
    
    this.aiInsights = insights;
    this.sendInsightsToServer(insights);
  }

  generateUXInsights() {
    const insights = [];
    const clickPattern = this.patterns.get('clicks');
    
    if (clickPattern?.hotspots?.length > 0) {
      insights.push({
        type: 'ux_optimization',
        message: `Users frequently click on ${clickPattern.mostClicked} elements. Consider optimizing these interactions.`,
        priority: 'medium',
        actionable: true,
        data: clickPattern
      });
    }
    
    return insights;
  }

  generatePerformanceInsights() {
    const insights = [];
    const perfMetrics = Array.from(this.performanceMetrics.values());
    
    const slowResources = perfMetrics.filter(m => m.duration > 1000);
    if (slowResources.length > 0) {
      insights.push({
        type: 'performance_optimization',
        message: `${slowResources.length} resources are loading slowly. Consider optimization.`,
        priority: 'high',
        actionable: true,
        data: slowResources
      });
    }
    
    return insights;
  }

  generateFeatureUsageInsights() {
    const insights = [];
    const customEvents = this.events.filter(e => e.type === 'custom');
    
    const featureUsage = {};
    customEvents.forEach(event => {
      const feature = event.eventName;
      featureUsage[feature] = (featureUsage[feature] || 0) + 1;
    });
    
    const underusedFeatures = Object.keys(featureUsage).filter(f => featureUsage[f] < 2);
    if (underusedFeatures.length > 0) {
      insights.push({
        type: 'feature_adoption',
        message: `Features ${underusedFeatures.join(', ')} have low usage. Consider improving discoverability.`,
        priority: 'low',
        actionable: true,
        data: featureUsage
      });
    }
    
    return insights;
  }

  // Utility methods
  getElementInfo(element) {
    return {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      textContent: element.textContent?.substring(0, 100),
      attributes: this.getRelevantAttributes(element)
    };
  }

  getElementPath(element) {
    const path = [];
    let current = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) selector += `#${current.id}`;
      if (current.className) selector += `.${current.className.split(' ').join('.')}`;
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }

  getRelevantAttributes(element) {
    const relevantAttrs = ['data-testid', 'aria-label', 'role', 'type', 'name'];
    const attrs = {};
    
    relevantAttrs.forEach(attr => {
      if (element.hasAttribute(attr)) {
        attrs[attr] = element.getAttribute(attr);
      }
    });
    
    return attrs;
  }

  updateHeatmap(x, y, type) {
    const key = `${Math.floor(x / 10)}_${Math.floor(y / 10)}`;
    const current = this.heatmapData.get(key) || { clicks: 0, hovers: 0 };
    
    if (type === 'click') current.clicks++;
    if (type === 'hover') current.hovers++;
    
    this.heatmapData.set(key, current);
  }

  recordEvent(eventData) {
    this.events.push(eventData);
    
    // Keep only last 1000 events to prevent memory issues
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
    
    // Send to server in batches
    if (this.events.length % 10 === 0) {
      this.sendEventsToServer();
    }
  }

  async sendEventsToServer() {
    if (!this.isTracking || this.events.length === 0) return;
    
    try {
      const response = await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userId: this.userId,
          events: this.events.slice(-10), // Send last 10 events
          heatmapData: Object.fromEntries(this.heatmapData),
          patterns: Object.fromEntries(this.patterns),
          insights: this.aiInsights
        })
      });
      
      if (response.ok) {

      }
    } catch (error) {

    }
  }

  async sendInsightsToServer(insights) {
    try {
      await fetch('/api/analytics/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userId: this.userId,
          insights,
          timestamp: Date.now()
        })
      });
    } catch (error) {

    }
  }

  // Public API
  setUserId(userId) {
    this.userId = userId;
  }

  startTracking() {
    this.isTracking = true;
  }

  stopTracking() {
    this.isTracking = false;
  }

  getHeatmapData() {
    return Object.fromEntries(this.heatmapData);
  }

  getInsights() {
    return this.aiInsights;
  }

  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      eventCount: this.events.length,
      patterns: Object.fromEntries(this.patterns),
      insights: this.aiInsights,
      heatmapPoints: this.heatmapData.size
    };
  }

  // Missing method stubs
  analyzeCustomEvent() {}
  analyzeKeyboardShortcuts() {}
  identifyClickHotspots() { return []; }
  identifyExitPages() { return []; }
  calculateBounceRate() { return 0; }
  calculateSessionDuration() { return 0; }
  calculateTimeSpent() { return 0; }
  findCommonSequences() { return []; }
  detectRapidClicking() { return { detected: false }; }
  detectUnusualNavigation() { return { detected: false }; }
  detectErrorSpike() { return { detected: false }; }
  handleAnomalies() {}
}

// Create singleton instance
export const aiTracker = new AITracker();

// Export for manual tracking
export const trackEvent = (eventName, data) => {
  aiTracker.trackCustomEvent(eventName, data);
};

export default aiTracker;