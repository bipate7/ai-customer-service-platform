// performance-monitor.js - Performance Monitoring for AI Customer Service Platform

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      // Core metrics
      pageLoadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,

      // API metrics
      apiResponseTimes: [],
      apiErrorCount: 0,
      apiSuccessCount: 0,

      // User interaction metrics
      userInteractions: [],
      sessionStartTime: Date.now(),
      messageCount: 0,

      // Resource metrics
      resourceLoadTimes: [],
      memoryUsage: null,

      // Error tracking
      errors: [],
      unhandledRejections: [],
    };

    this.thresholds = {
      slowApiCall: 5000, // 5 seconds
      highMemoryUsage: 0.8, // 80% of available memory
      highCpuUsage: 0.7, // 70% CPU usage
      maxInteractionDelay: 100, // 100ms
    };

    this.initializeMonitoring();
  }

  /**
   * Initialize all performance monitoring
   */
  initializeMonitoring() {
    this.setupPerformanceObserver();
    this.setupUserInteractionTracking();
    this.setupResourceTracking();
    this.setupMemoryMonitoring();
    this.setupVisibilityTracking();
    this.setupNetworkMonitoring();
    this.startPeriodicHealthChecks();

    console.log("🔍 Performance monitoring initialized");
  }

  /**
   * Setup Performance Observer for Core Web Vitals
   */
  setupPerformanceObserver() {
    if (!window.PerformanceObserver) return;

    // First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            this.metrics.firstContentfulPaint = entry.startTime;
            this.reportMetric("first_contentful_paint", entry.startTime);
          }
        }
      });
      fcpObserver.observe({ entryTypes: ["paint"] });
    } catch (e) {
      console.warn("FCP observer not supported:", e);
    }

    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.largestContentfulPaint = entry.startTime;
          this.reportMetric("largest_contentful_paint", entry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (e) {
      console.warn("LCP observer not supported:", e);
    }

    // Cumulative Layout Shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            this.metrics.cumulativeLayoutShift += entry.value;
            this.reportMetric("cumulative_layout_shift", entry.value);
          }
        }
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (e) {
      console.warn("CLS observer not supported:", e);
    }

    // Long Tasks monitoring
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            // 50ms threshold
            this.reportMetric("long_task", {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
            });
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ["longtask"] });
    } catch (e) {
      console.warn("Long task observer not supported:", e);
    }
  }

  /**
   * Track user interactions
   */
  setupUserInteractionTracking() {
    // Click tracking
    document.addEventListener("click", (event) => {
      const interaction = {
        type: "click",
        target: this.getElementInfo(event.target),
        timestamp: Date.now(),
        position: { x: event.clientX, y: event.clientY },
      };

      this.trackInteraction(interaction);
    });

    // Input tracking
    document.addEventListener("input", (event) => {
      const interaction = {
        type: "input",
        target: this.getElementInfo(event.target),
        timestamp: Date.now(),
        valueLength: event.target.value?.length || 0,
      };

      this.trackInteraction(interaction);
    });

    // Keypress tracking for important keys
    document.addEventListener("keydown", (event) => {
      if (
        ["Enter", "Escape", "Tab", "ArrowUp", "ArrowDown"].includes(event.key)
      ) {
        const interaction = {
          type: "keydown",
          key: event.key,
          target: this.getElementInfo(event.target),
          timestamp: Date.now(),
        };

        this.trackInteraction(interaction);
      }
    });

    // Scroll tracking (debounced)
    let scrollTimeout;
    window.addEventListener("scroll", () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackInteraction({
          type: "scroll",
          position: { x: window.scrollX, y: window.scrollY },
          timestamp: Date.now(),
        });
      }, 100);
    });
  }

  /**
   * Track resource loading times
   */
  setupResourceTracking() {
    if (!window.PerformanceObserver) return;

    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (
            entry.initiatorType === "fetch" ||
            entry.initiatorType === "xmlhttprequest"
          ) {
            this.metrics.resourceLoadTimes.push({
              name: entry.name,
              duration: entry.duration,
              size: entry.transferSize || 0,
              type: entry.initiatorType,
              timestamp: Date.now(),
            });
          }
        }
      });
      resourceObserver.observe({ entryTypes: ["resource"] });
    } catch (e) {
      console.warn("Resource observer not supported:", e);
    }
  }

  /**
   * Monitor memory usage (if available)
   */
  setupMemoryMonitoring() {
    if (performance.memory) {
      setInterval(() => {
        const memory = performance.memory;
        this.metrics.memoryUsage = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
        };

        // Alert on high memory usage
        if (
          this.metrics.memoryUsage.percentage >
          this.thresholds.highMemoryUsage * 100
        ) {
          this.reportMetric("high_memory_usage", this.metrics.memoryUsage);
        }
      }, 10000); // Check every 10 seconds
    }
  }

  /**
   * Track visibility changes
   */
  setupVisibilityTracking() {
    document.addEventListener("visibilitychange", () => {
      const metric = {
        hidden: document.hidden,
        timestamp: Date.now(),
        sessionDuration: Date.now() - this.metrics.sessionStartTime,
      };

      this.reportMetric("visibility_change", metric);

      if (document.hidden) {
        this.reportMetric("page_hidden", metric);
      } else {
        this.reportMetric("page_visible", metric);
      }
    });
  }

  /**
   * Monitor network conditions
   */
  setupNetworkMonitoring() {
    // Network information API (if available)
    if (navigator.connection) {
      const connection = navigator.connection;

      connection.addEventListener("change", () => {
        this.reportMetric("network_change", {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
          timestamp: Date.now(),
        });
      });
    }

    // Online/offline tracking
    window.addEventListener("online", () => {
      this.reportMetric("network_online", { timestamp: Date.now() });
    });

    window.addEventListener("offline", () => {
      this.reportMetric("network_offline", { timestamp: Date.now() });
    });
  }

  /**
   * Start periodic health checks
   */
  startPeriodicHealthChecks() {
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds

    // Initial health check
    setTimeout(() => this.performHealthCheck(), 5000);
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const healthCheck = {
      timestamp: Date.now(),
      sessionDuration: Date.now() - this.metrics.sessionStartTime,
      messageCount: this.metrics.messageCount,
      apiCalls: this.metrics.apiSuccessCount + this.metrics.apiErrorCount,
      apiSuccessRate:
        this.metrics.apiSuccessCount /
          (this.metrics.apiSuccessCount + this.metrics.apiErrorCount) || 0,
      interactionCount: this.metrics.userInteractions.length,
      errorCount: this.metrics.errors.length,
    };

    // Check API health
    try {
      const apiHealth = await window.apiService?.healthCheck();
      healthCheck.apiHealth = apiHealth;
    } catch (error) {
      healthCheck.apiHealth = { status: "unhealthy", error: error.message };
    }

    this.reportMetric("health_check", healthCheck);
    return healthCheck;
  }

  /**
   * Track API call performance
   */
  trackAPICall(endpoint, duration, success = true) {
    const apiCall = {
      endpoint,
      duration,
      success,
      timestamp: Date.now(),
    };

    this.metrics.apiResponseTimes.push(apiCall);

    if (success) {
      this.metrics.apiSuccessCount++;
    } else {
      this.metrics.apiErrorCount++;
    }

    // Keep only last 100 API calls
    if (this.metrics.apiResponseTimes.length > 100) {
      this.metrics.apiResponseTimes.shift();
    }

    // Report slow API calls
    if (duration > this.thresholds.slowApiCall) {
      this.reportMetric("slow_api_call", apiCall);
    }

    // Report API errors
    if (!success) {
      this.reportMetric("api_error", apiCall);
    }
  }

  /**
   * Track user interaction
   */
  trackInteraction(interaction) {
    this.metrics.userInteractions.push(interaction);

    // Keep only last 200 interactions
    if (this.metrics.userInteractions.length > 200) {
      this.metrics.userInteractions.shift();
    }

    // Report to analytics if enabled
    if (window.appConfig?.getConfig().FEATURES.ANALYTICS) {
      this.reportMetric("user_interaction", interaction);
    }
  }

  /**
   * Track message count
   */
  trackMessage() {
    this.metrics.messageCount++;
  }

  /**
   * Track errors
   */
  trackError(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.metrics.errors.push(errorData);

    // Keep only last 50 errors
    if (this.metrics.errors.length > 50) {
      this.metrics.errors.shift();
    }

    this.reportMetric("error", errorData);
  }

  /**
   * Report metric to analytics
   */
  reportMetric(type, data) {
    const metricData = {
      type,
      data,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      userId: window.aiCustomerService?.currentUser,
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    // Log to console in development
    if (window.appConfig?.getConfig().ENVIRONMENT === "development") {
      console.log(`[Metric] ${type}:`, metricData);
    }

    // Send to analytics service in production
    if (
      window.appConfig?.getConfig().ENVIRONMENT === "production" &&
      window.appConfig?.getConfig().FEATURES.ANALYTICS
    ) {
      this.sendToAnalytics(metricData).catch(console.warn);
    }
  }

  /**
   * Send metric to analytics service
   */
  async sendToAnalytics(data) {
    try {
      await fetch(
        `${window.appConfig.getConfig().API_BASE_URL}/api/analytics/metrics`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      console.warn("Analytics service unavailable:", error);
    }
  }

  /**
   * Get session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem("performance_session_id");
    if (!sessionId) {
      sessionId =
        "perf-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem("performance_session_id", sessionId);
    }
    return sessionId;
  }

  /**
   * Get element information for tracking
   */
  getElementInfo(element) {
    if (!element) return null;

    return {
      tagName: element.tagName,
      id: element.id || null,
      className: element.className || null,
      text: element.textContent?.substring(0, 100) || null, // Limit text length
    };
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    const apiResponseTimes = this.metrics.apiResponseTimes.map(
      (call) => call.duration
    );
    const avgApiResponseTime =
      apiResponseTimes.length > 0
        ? apiResponseTimes.reduce((a, b) => a + b, 0) / apiResponseTimes.length
        : 0;

    return {
      // Core Web Vitals
      coreWebVitals: {
        firstContentfulPaint: this.metrics.firstContentfulPaint,
        largestContentfulPaint: this.metrics.largestContentfulPaint,
        cumulativeLayoutShift: this.metrics.cumulativeLayoutShift,
      },

      // API Performance
      apiPerformance: {
        totalCalls: this.metrics.apiSuccessCount + this.metrics.apiErrorCount,
        successCount: this.metrics.apiSuccessCount,
        errorCount: this.metrics.apiErrorCount,
        successRate:
          this.metrics.apiSuccessCount /
            (this.metrics.apiSuccessCount + this.metrics.apiErrorCount) || 0,
        averageResponseTime: avgApiResponseTime,
        p95ResponseTime: this.calculatePercentile(apiResponseTimes, 95),
        p99ResponseTime: this.calculatePercentile(apiResponseTimes, 99),
      },

      // User Engagement
      userEngagement: {
        sessionDuration: Date.now() - this.metrics.sessionStartTime,
        interactionCount: this.metrics.userInteractions.length,
        messageCount: this.metrics.messageCount,
        lastActivity:
          this.metrics.userInteractions[
            this.metrics.userInteractions.length - 1
          ]?.timestamp || null,
      },

      // System Health
      systemHealth: {
        memoryUsage: this.metrics.memoryUsage,
        errorCount: this.metrics.errors.length,
        resourceLoadCount: this.metrics.resourceLoadTimes.length,
      },

      // Timestamps
      timestamps: {
        sessionStart: this.metrics.sessionStartTime,
        reportGenerated: Date.now(),
      },
    };
  }

  /**
   * Calculate percentile from array of numbers
   */
  calculatePercentile(values, percentile) {
    if (!values.length) return 0;

    const sorted = values.slice().sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) return sorted[lower];

    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  }

  /**
   * Reset metrics (for testing)
   */
  reset() {
    this.metrics = {
      pageLoadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      apiResponseTimes: [],
      apiErrorCount: 0,
      apiSuccessCount: 0,
      userInteractions: [],
      sessionStartTime: Date.now(),
      messageCount: 0,
      resourceLoadTimes: [],
      memoryUsage: null,
      errors: [],
      unhandledRejections: [],
    };
  }
}

// Make PerformanceMonitor available globally
window.PerformanceMonitor = PerformanceMonitor;
