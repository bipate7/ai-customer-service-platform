// js/performance-optimizer.js - Performance Optimization for Phase 8

class PerformanceOptimizer {
  constructor() {
    this.metrics = new Map();
    this.optimizationRules = this.loadOptimizationRules();
    this.performanceObserver = null;
    this.init();
  }

  init() {
    this.setupPerformanceMonitoring();
    this.setupResourceOptimization();
    this.setupMemoryManagement();
    this.startPerformanceTracking();
  }

  setupPerformanceMonitoring() {
    // Monitor Core Web Vitals
    if ("PerformanceObserver" in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.value);
        }
      });

      try {
        this.performanceObserver.observe({
          entryTypes: [
            "navigation",
            "paint",
            "largest-contentful-paint",
            "first-input",
          ],
        });
      } catch (e) {
        console.warn("PerformanceObserver not supported:", e);
      }
    }

    // Monitor custom metrics
    this.monitorResponseTimes();
    this.monitorMemoryUsage();
  }

  setupResourceOptimization() {
    // Implement resource hints
    this.addResourceHints();

    // Optimize images
    this.optimizeImages();

    // Implement lazy loading
    this.setupLazyLoading();
  }

  setupMemoryManagement() {
    // Monitor memory usage
    if ("memory" in performance) {
      setInterval(() => {
        this.recordMetric("memory_usage", performance.memory.usedJSHeapSize);
      }, 30000);
    }

    // Clean up old data
    this.setupDataCleanup();
  }

  startPerformanceTracking() {
    // Track initial page load
    window.addEventListener("load", () => {
      this.trackPageLoad();
    });

    // Track user interactions
    this.trackUserInteractions();
  }

  recordMetric(name, value, tags = {}) {
    const timestamp = Date.now();
    const metric = { name, value, timestamp, tags };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name).push(metric);

    // Keep only last 1000 metrics per type
    if (this.metrics.get(name).length > 1000) {
      this.metrics.set(name, this.metrics.get(name).slice(-1000));
    }

    // Check if optimization is needed
    this.checkOptimizationRules(name, value);
  }

  checkOptimizationRules(metricName, value) {
    const rules = this.optimizationRules[metricName];
    if (rules) {
      rules.forEach((rule) => {
        if (this.evaluateRule(rule, value)) {
          this.applyOptimization(rule.optimization);
        }
      });
    }
  }

  evaluateRule(rule, value) {
    switch (rule.operator) {
      case "gt":
        return value > rule.threshold;
      case "lt":
        return value < rule.threshold;
      case "eq":
        return value === rule.threshold;
      default:
        return false;
    }
  }

  applyOptimization(optimization) {
    console.log("Applying optimization:", optimization);

    switch (optimization.type) {
      case "reduce_quality":
        this.reduceImageQuality(optimization.level);
        break;
      case "enable_caching":
        this.enableAggressiveCaching();
        break;
      case "disable_animations":
        this.disableNonEssentialAnimations();
        break;
      case "reduce_frequency":
        this.reduceUpdateFrequency();
        break;
      case "compress_data":
        this.enableDataCompression();
        break;
    }
  }

  reduceImageQuality(level) {
    // Implement image quality reduction
    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      if (!img.hasAttribute("data-optimized")) {
        // Add lazy loading and quality hints
        img.loading = "lazy";
        img.setAttribute("data-optimized", "true");
      }
    });
  }

  enableAggressiveCaching() {
    // Implement aggressive caching strategy
    if ("caches" in window) {
      caches.open("aggressive-cache").then((cache) => {
        // Cache critical resources
      });
    }
  }

  disableNonEssentialAnimations() {
    // Add class to disable animations
    document.documentElement.classList.add("reduce-motion");
  }

  reduceUpdateFrequency() {
    // Throttle frequent updates
    window.APP_CONFIG.PERFORMANCE.DEBOUNCE_DELAY = Math.min(
      window.APP_CONFIG.PERFORMANCE.DEBOUNCE_DELAY * 2,
      1000
    );
  }

  enableDataCompression() {
    // Enable data compression for API calls
    window.APP_CONFIG.PERFORMANCE.ENABLE_COMPRESSION = true;
  }

  monitorResponseTimes() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      const response = await originalFetch(...args);
      const end = performance.now();

      this.recordMetric("api_response_time", end - start, {
        endpoint: args[0],
        status: response.status,
      });

      return response;
    };
  }

  monitorMemoryUsage() {
    if ("memory" in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.recordMetric("memory_used", memory.usedJSHeapSize);
        this.recordMetric("memory_limit", memory.jsHeapSizeLimit);
        this.recordMetric("memory_total", memory.totalJSHeapSize);
      }, 10000);
    }
  }

  trackPageLoad() {
    const navigation = performance.getEntriesByType("navigation")[0];
    if (navigation) {
      this.recordMetric(
        "page_load_time",
        navigation.loadEventEnd - navigation.loadEventStart
      );
      this.recordMetric(
        "dom_content_loaded",
        navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart
      );
    }

    // Track Core Web Vitals
    this.trackLCP();
    this.trackFID();
    this.trackCLS();
  }

  async trackLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric("lcp", lastEntry.startTime);
    });
    observer.observe({ entryTypes: ["largest-contentful-paint"] });
  }

  async trackFID() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.recordMetric("fid", entry.processingStart - entry.startTime);
      });
    });
    observer.observe({ entryTypes: ["first-input"] });
  }

  async trackCLS() {
    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          sessionEntries.push(entry);
          sessionValue += entry.value;
          clsValue = Math.max(clsValue, sessionValue);
        }
      }
    });

    observer.observe({ type: "layout-shift", buffered: true });

    // Reset session on user interaction
    ["click", "keydown", "scroll"].forEach((type) => {
      document.addEventListener(
        type,
        () => {
          sessionValue = 0;
          sessionEntries = [];
        },
        { once: true }
      );
    });

    // Record final CLS
    window.addEventListener("beforeunload", () => {
      this.recordMetric("cls", clsValue);
    });
  }

  trackUserInteractions() {
    const interactionTypes = ["click", "keypress", "scroll", "mousemove"];

    interactionTypes.forEach((type) => {
      document.addEventListener(
        type,
        (e) => {
          this.recordMetric(`user_interaction_${type}`, 1, {
            target: e.target.tagName,
            coordinates: `${e.clientX},${e.clientY}`,
          });
        },
        { passive: true }
      );
    });
  }

  addResourceHints() {
    const hints = [
      { rel: "dns-prefetch", href: window.APP_CONFIG.API_BASE_URL },
      { rel: "preconnect", href: window.APP_CONFIG.API_BASE_URL },
    ];

    hints.forEach((hint) => {
      const link = document.createElement("link");
      link.rel = hint.rel;
      link.href = hint.href;
      document.head.appendChild(link);
    });
  }

  optimizeImages() {
    // Implement image optimization
    const images = document.querySelectorAll("img[data-src]");
    images.forEach((img) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            img.src = img.dataset.src;
            observer.unobserve(img);
          }
        });
      });
      observer.observe(img);
    });
  }

  setupLazyLoading() {
    // Implement lazy loading for non-critical resources
    const lazyElements = document.querySelectorAll("[data-lazy]");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadLazyElement(entry.target);
          observer.unobserve(entry.target);
        }
      });
    });

    lazyElements.forEach((el) => observer.observe(el));
  }

  loadLazyElement(element) {
    const loadType = element.dataset.lazy;

    switch (loadType) {
      case "component":
        this.loadLazyComponent(element);
        break;
      case "image":
        this.loadLazyImage(element);
        break;
      case "data":
        this.loadLazyData(element);
        break;
    }
  }

  setupDataCleanup() {
    // Clean up old metrics periodically
    setInterval(() => {
      this.cleanupOldData();
    }, 300000); // Every 5 minutes
  }

  cleanupOldData() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    this.metrics.forEach((values, key) => {
      const filtered = values.filter(
        (metric) => now - metric.timestamp < maxAge
      );
      this.metrics.set(key, filtered);
    });

    // Clean up localStorage
    this.cleanupLocalStorage();
  }

  cleanupLocalStorage() {
    const keysToKeep = ["ai_chat_session", "ai_user_preferences", "app_config"];
    Object.keys(localStorage).forEach((key) => {
      if (!keysToKeep.includes(key) && !key.startsWith("api_cache_")) {
        try {
          const item = localStorage.getItem(key);
          const data = JSON.parse(item);
          // Remove items older than 7 days
          if (
            data.timestamp &&
            Date.now() - new Date(data.timestamp).getTime() >
              7 * 24 * 60 * 60 * 1000
          ) {
            localStorage.removeItem(key);
          }
        } catch {
          // If not JSON or no timestamp, keep it
        }
      }
    });
  }

  getPerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: {},
      recommendations: [],
    };

    // Collect metrics
    this.metrics.forEach((values, key) => {
      const recent = values.slice(-100); // Last 100 measurements
      const avg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
      report.metrics[key] = {
        current: values[values.length - 1]?.value,
        average: avg,
        trend: this.calculateTrend(values),
      };
    });

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report.metrics);

    return report;
  }

  calculateTrend(values) {
    if (values.length < 2) return "stable";

    const recent = values.slice(-10);
    const older = values.slice(-20, -10);

    const recentAvg =
      recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;

    if (recentAvg > olderAvg * 1.1) return "increasing";
    if (recentAvg < olderAvg * 0.9) return "decreasing";
    return "stable";
  }

  generateRecommendations(metrics) {
    const recommendations = [];

    if (metrics.api_response_time?.average > 1000) {
      recommendations.push({
        type: "performance",
        priority: "high",
        message:
          "API response times are slow. Consider optimizing backend queries.",
        action: "review_api_endpoints",
      });
    }

    if (metrics.memory_used?.current > metrics.memory_limit?.current * 0.8) {
      recommendations.push({
        type: "memory",
        priority: "high",
        message:
          "Memory usage is high. Consider implementing memory optimization.",
        action: "optimize_memory_usage",
      });
    }

    if (metrics.lcp?.current > 2500) {
      recommendations.push({
        type: "user_experience",
        priority: "medium",
        message:
          "Largest Contentful Paint is slow. Optimize critical rendering path.",
        action: "optimize_lcp",
      });
    }

    return recommendations;
  }

  loadOptimizationRules() {
    return {
      api_response_time: [
        {
          operator: "gt",
          threshold: 2000,
          optimization: {
            type: "reduce_quality",
            level: "medium",
          },
        },
        {
          operator: "gt",
          threshold: 5000,
          optimization: {
            type: "disable_animations",
            level: "all",
          },
        },
      ],
      memory_used: [
        {
          operator: "gt",
          threshold: 100000000, // 100MB
          optimization: {
            type: "compress_data",
            level: "high",
          },
        },
      ],
      user_interaction_click: [
        {
          operator: "gt",
          threshold: 100, // 100 clicks per minute
          optimization: {
            type: "reduce_frequency",
            level: "medium",
          },
        },
      ],
    };
  }

  // Public API
  getMetrics() {
    return this.metrics;
  }

  getPerformanceScore() {
    const scores = [];

    // Calculate score based on various metrics
    if (this.metrics.has("lcp")) {
      const lcp = this.metrics.get("lcp").slice(-1)[0]?.value || 0;
      scores.push(this.calculateLCPScore(lcp));
    }

    if (this.metrics.has("fid")) {
      const fid = this.metrics.get("fid").slice(-1)[0]?.value || 0;
      scores.push(this.calculateFIDScore(fid));
    }

    if (this.metrics.has("cls")) {
      const cls = this.metrics.get("cls").slice(-1)[0]?.value || 0;
      scores.push(this.calculateCLSScore(cls));
    }

    return scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 100;
  }

  calculateLCPScore(lcp) {
    if (lcp <= 2500) return 100;
    if (lcp <= 4000) return 65;
    return 0;
  }

  calculateFIDScore(fid) {
    if (fid <= 100) return 100;
    if (fid <= 300) return 65;
    return 0;
  }

  calculateCLSScore(cls) {
    if (cls <= 0.1) return 100;
    if (cls <= 0.25) return 65;
    return 0;
  }
}

// Make PerformanceOptimizer available globally
window.PerformanceOptimizer = PerformanceOptimizer;
