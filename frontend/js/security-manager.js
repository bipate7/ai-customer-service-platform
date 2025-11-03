// js/security-manager.js - Enterprise Security for Phase 9

class SecurityManager {
  constructor() {
    this.securityConfig = this.loadSecurityConfig();
    this.encryptionKey = this.generateEncryptionKey();
    this.sessionManager = new SessionManager();
    this.auditLogger = new AuditLogger();
    this.init();
  }

  init() {
    this.setupSecurityHeaders();
    this.setupContentSecurityPolicy();
    this.setupEncryption();
    this.setupSecurityMonitoring();
    this.setupComplianceFeatures();
  }

  loadSecurityConfig() {
    const defaultConfig = {
      ENCRYPTION: {
        ENABLED: true,
        ALGORITHM: "AES-GCM",
        KEY_LENGTH: 256,
      },
      SESSION: {
        TIMEOUT: 3600000, // 1 hour
        RENEWAL_INTERVAL: 300000, // 5 minutes
        MAX_CONCURRENT_SESSIONS: 3,
      },
      RATE_LIMITING: {
        ENABLED: true,
        REQUESTS_PER_MINUTE: 60,
        BURST_LIMIT: 10,
      },
      COMPLIANCE: {
        GDPR_ENABLED: true,
        CCPA_ENABLED: false,
        DATA_RETENTION_DAYS: 90,
        AUTO_DELETION: true,
      },
      AUDIT: {
        LOG_ALL_ACTIONS: true,
        RETENTION_DAYS: 365,
        ENCRYPT_LOGS: true,
      },
    };

    try {
      const saved = localStorage.getItem("security_config");
      return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    } catch (error) {
      console.warn("Failed to load security config:", error);
      return defaultConfig;
    }
  }

  setupSecurityHeaders() {
    // Add security headers to all fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (input, init = {}) => {
      const headers = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        ...init.headers,
      };

      // Add CSRF token if available
      const csrfToken = this.getCSRFToken();
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }

      return originalFetch(input, {
        ...init,
        headers,
      });
    };
  }

  setupContentSecurityPolicy() {
    // Implement CSP through meta tag
    const cspMeta = document.createElement("meta");
    cspMeta.httpEquiv = "Content-Security-Policy";
    cspMeta.content = this.generateCSP();
    document.head.appendChild(cspMeta);
  }

  generateCSP() {
    return `
            default-src 'self';
            script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.tailwindcss.com;
            style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com;
            font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com;
            connect-src 'self' ${window.APP_CONFIG?.API_BASE_URL || ""};
            img-src 'self' data: https:;
            frame-ancestors 'none';
            base-uri 'self';
            form-action 'self'
        `
      .replace(/\s+/g, " ")
      .trim();
  }

  setupEncryption() {
    if (!this.securityConfig.ENCRYPTION.ENABLED) return;

    // Generate and store encryption key
    if (!localStorage.getItem("encryption_key")) {
      localStorage.setItem("encryption_key", this.encryptionKey);
    } else {
      this.encryptionKey = localStorage.getItem("encryption_key");
    }
  }

  setupSecurityMonitoring() {
    // Monitor for suspicious activities
    this.monitorUserBehavior();
    this.monitorNetworkRequests();
    this.monitorStorageAccess();
    this.setupIntrusionDetection();
  }

  setupComplianceFeatures() {
    if (this.securityConfig.COMPLIANCE.GDPR_ENABLED) {
      this.setupGDPRCompliance();
    }

    if (this.securityConfig.COMPLIANCE.CCPA_ENABLED) {
      this.setupCCPACompliance();
    }

    this.setupDataRetention();
  }

  // Encryption Methods
  async encryptData(data) {
    if (!this.securityConfig.ENCRYPTION.ENABLED) return data;

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));

      const key = await this.getCryptoKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        key,
        dataBuffer
      );

      const encryptedArray = new Uint8Array(encrypted);
      const result = new Uint8Array(iv.length + encryptedArray.length);
      result.set(iv);
      result.set(encryptedArray, iv.length);

      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error("Encryption failed:", error);
      return data;
    }
  }

  async decryptData(encryptedData) {
    if (!this.securityConfig.ENCRYPTION.ENABLED) return encryptedData;

    try {
      const encryptedArray = Uint8Array.from(atob(encryptedData), (c) =>
        c.charCodeAt(0)
      );
      const iv = encryptedArray.slice(0, 12);
      const data = encryptedArray.slice(12);

      const key = await this.getCryptoKey();

      const decrypted = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        key,
        data
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    } catch (error) {
      console.error("Decryption failed:", error);
      return encryptedData;
    }
  }

  async getCryptoKey() {
    const keyBuffer = new TextEncoder().encode(this.encryptionKey).slice(0, 32);
    return crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  }

  generateEncryptionKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  }

  // Session Management
  setupSessionManagement() {
    this.sessionManager.startSession();
    this.setupSessionRenewal();
    this.setupSessionTimeout();
  }

  // Security Monitoring
  monitorUserBehavior() {
    let suspiciousActions = 0;
    const suspiciousPatterns = [
      "rapid_clicks",
      "excessive_errors",
      "unusual_navigation",
      "data_exfiltration_attempts",
    ];

    // Track user interactions
    document.addEventListener("click", (e) => {
      this.detectSuspiciousClickPattern(e);
    });

    document.addEventListener("keydown", (e) => {
      this.detectSuspiciousKeyPattern(e);
    });

    // Monitor for dev tools opening
    this.monitorDevTools();
  }

  monitorNetworkRequests() {
    let requestCount = 0;
    const requestWindow = 60000; // 1 minute
    const maxRequests = this.securityConfig.RATE_LIMITING.REQUESTS_PER_MINUTE;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      requestCount++;

      if (requestCount > maxRequests) {
        this.auditLogger.log("SECURITY", "Rate limit exceeded", {
          requestCount,
          endpoint: args[0],
        });
        throw new Error("Rate limit exceeded. Please try again later.");
      }

      // Reset counter after window
      setTimeout(() => {
        requestCount = Math.max(0, requestCount - 1);
      }, requestWindow / maxRequests);

      return originalFetch(...args);
    };
  }

  monitorStorageAccess() {
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;

    // Monitor localStorage access
    localStorage.setItem = (key, value) => {
      this.auditLogger.log("STORAGE", "Data stored", {
        key,
        valueLength: value?.length,
      });
      return originalSetItem.call(localStorage, key, value);
    };

    localStorage.getItem = (key) => {
      this.auditLogger.log("STORAGE", "Data accessed", { key });
      return originalGetItem.call(localStorage, key);
    };
  }

  setupIntrusionDetection() {
    // Detect common attack patterns
    this.detectXSSAttempts();
    this.detectCSRFAttempts();
    this.detectSQLInjectionAttempts();
  }

  detectXSSAttempts() {
    // Monitor for script injection attempts
    const originalInnerHTML = Object.getOwnPropertyDescriptor(
      Element.prototype,
      "innerHTML"
    ).set;

    Object.defineProperty(Element.prototype, "innerHTML", {
      set: function (value) {
        if (typeof value === "string" && this.detectXSSPattern(value)) {
          SecurityManager.reportThreat("XSS_ATTEMPT", {
            element: this.tagName,
            content: value.substring(0, 100),
          });
          throw new Error("Potential XSS attack detected");
        }
        return originalInnerHTML.call(this, value);
      },
    });
  }

  detectXSSPattern(content) {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /vbscript:/gi,
      /expression\s*\(/gi,
    ];

    return xssPatterns.some((pattern) => pattern.test(content));
  }

  detectCSRFAttempts() {
    // Verify origin for all requests
    const originalFetch = window.fetch;
    window.fetch = async (input, init = {}) => {
      const url = typeof input === "string" ? input : input.url;

      if (url && !this.isSameOrigin(url)) {
        this.auditLogger.log("SECURITY", "Cross-origin request blocked", {
          url,
        });
        throw new Error("Cross-origin requests are not allowed");
      }

      return originalFetch(input, init);
    };
  }

  isSameOrigin(url) {
    try {
      const requestUrl = new URL(url, window.location.href);
      const currentUrl = new URL(window.location.href);

      return requestUrl.origin === currentUrl.origin;
    } catch {
      return false;
    }
  }

  // Compliance Features
  setupGDPRCompliance() {
    this.setupCookieConsent();
    this.setupDataAccessRequests();
    this.setupDataDeletionRequests();
  }

  setupCookieConsent() {
    if (!this.getCookieConsent()) {
      this.showCookieConsentBanner();
    }
  }

  setupDataAccessRequests() {
    // Implement GDPR data access right
    window.requestDataExport = () => {
      return this.exportUserData();
    };
  }

  setupDataDeletionRequests() {
    // Implement GDPR right to be forgotten
    window.requestDataDeletion = () => {
      return this.deleteUserData();
    };
  }

  setupCCPACompliance() {
    // Implement CCPA/CPRA compliance
    this.setupDoNotSellFeature();
  }

  setupDoNotSellFeature() {
    // Add "Do Not Sell My Personal Information" option
    if (!localStorage.getItem("ccpa_do_not_sell")) {
      this.showCCPABanner();
    }
  }

  setupDataRetention() {
    // Auto-delete old data based on retention policy
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  // Utility Methods
  getCSRFToken() {
    let token = sessionStorage.getItem("csrf_token");
    if (!token) {
      token = this.generateCSRFToken();
      sessionStorage.setItem("csrf_token", token);
    }
    return token;
  }

  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  }

  getCookieConsent() {
    return localStorage.getItem("cookie_consent") === "true";
  }

  setCookieConsent(consent) {
    localStorage.setItem("cookie_consent", consent.toString());

    if (!consent) {
      this.clearNonEssentialCookies();
    }
  }

  clearNonEssentialCookies() {
    // Clear analytics and tracking cookies
    const cookies = document.cookie.split(";");
    cookies.forEach((cookie) => {
      const [name] = cookie.split("=");
      if (name.trim().startsWith("_ga") || name.trim().startsWith("_gid")) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
  }

  async exportUserData() {
    const userData = {
      profile: this.getUserProfile(),
      conversations: this.getUserConversations(),
      preferences: this.getUserPreferences(),
      analytics: this.getUserAnalytics(),
    };

    // Encrypt sensitive data
    if (this.securityConfig.ENCRYPTION.ENABLED) {
      userData.conversations = await this.encryptData(userData.conversations);
    }

    return userData;
  }

  async deleteUserData() {
    const keysToDelete = [
      "ai_chat_session",
      "ai_user_preferences",
      "ai_analytics_data",
      "ai_chat_history",
    ];

    keysToDelete.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // Clear cookies
    this.clearAllCookies();

    this.auditLogger.log("COMPLIANCE", "User data deleted", {
      userId: this.getUserId(),
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: "All user data has been deleted" };
  }

  clearAllCookies() {
    const cookies = document.cookie.split(";");
    cookies.forEach((cookie) => {
      const [name] = cookie.split("=");
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  }

  cleanupOldData() {
    const retentionDays = this.securityConfig.COMPLIANCE.DATA_RETENTION_DAYS;
    const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    // Clean up old analytics data
    this.cleanupOldAnalyticsData(cutoffTime);

    // Clean up old audit logs
    this.cleanupOldAuditLogs(cutoffTime);
  }

  cleanupOldAnalyticsData(cutoffTime) {
    try {
      const analyticsData = JSON.parse(
        localStorage.getItem("ai_analytics_data") || "{}"
      );
      if (
        analyticsData.timestamp &&
        new Date(analyticsData.timestamp).getTime() < cutoffTime
      ) {
        localStorage.removeItem("ai_analytics_data");
      }
    } catch (error) {
      console.warn("Failed to cleanup analytics data:", error);
    }
  }

  // Threat Reporting
  static reportThreat(threatType, details) {
    // Report to security monitoring service
    console.warn(`Security threat detected: ${threatType}`, details);

    // In production, this would send to security monitoring system
    fetch("/api/security/threats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: threatType,
        details: details,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    }).catch(console.error);
  }

  // Public API
  getSecurityStatus() {
    return {
      encryption: this.securityConfig.ENCRYPTION.ENABLED,
      session: this.sessionManager.getSessionStatus(),
      rateLimiting: this.securityConfig.RATE_LIMITING.ENABLED,
      compliance: {
        gdpr: this.securityConfig.COMPLIANCE.GDPR_ENABLED,
        ccpa: this.securityConfig.COMPLIANCE.CCPA_ENABLED,
      },
      threatsDetected: this.auditLogger.getThreatCount(),
    };
  }

  updateSecurityConfig(newConfig) {
    this.securityConfig = { ...this.securityConfig, ...newConfig };
    localStorage.setItem(
      "security_config",
      JSON.stringify(this.securityConfig)
    );

    // Re-initialize with new config
    this.init();
  }
}

// Session Manager
class SessionManager {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.lastActivity = Date.now();
    this.activityCount = 0;
  }

  startSession() {
    sessionStorage.setItem("session_id", this.sessionId);
    sessionStorage.setItem("session_start", new Date().toISOString());

    this.trackActivity();
    this.startInactivityTimer();
  }

  generateSessionId() {
    return "sess_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  trackActivity() {
    this.lastActivity = Date.now();
    this.activityCount++;
    sessionStorage.setItem("last_activity", this.lastActivity.toString());
  }

  startInactivityTimer() {
    setInterval(() => {
      const inactiveTime = Date.now() - this.lastActivity;
      if (inactiveTime > 3600000) {
        // 1 hour
        this.endSession();
        window.location.reload();
      }
    }, 60000); // Check every minute
  }

  endSession() {
    sessionStorage.clear();
    localStorage.removeItem("encryption_key");
  }

  getSessionStatus() {
    return {
      id: this.sessionId,
      duration:
        Date.now() -
        parseInt(sessionStorage.getItem("session_start") || Date.now()),
      activityCount: this.activityCount,
      lastActivity: new Date(this.lastActivity).toISOString(),
    };
  }
}

// Audit Logger
class AuditLogger {
  constructor() {
    this.logs = [];
    this.threatCount = 0;
    this.loadLogs();
  }

  log(category, action, details = {}) {
    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      category,
      action,
      details,
      userId: this.getUserId(),
      sessionId: sessionStorage.getItem("session_id"),
      userAgent: navigator.userAgent,
      ip: "client-side", // In real app, this would come from server
    };

    this.logs.push(logEntry);
    this.saveLogs();

    if (category === "SECURITY") {
      this.threatCount++;
    }

    // In production, also send to server
    this.sendToServer(logEntry);
  }

  generateLogId() {
    return "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  saveLogs() {
    try {
      const logsToSave = this.logs.slice(-1000); // Keep only last 1000 logs
      localStorage.setItem("audit_logs", JSON.stringify(logsToSave));
    } catch (error) {
      console.warn("Failed to save audit logs:", error);
    }
  }

  loadLogs() {
    try {
      const savedLogs = localStorage.getItem("audit_logs");
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.warn("Failed to load audit logs:", error);
    }
  }

  sendToServer(logEntry) {
    // In production, this would send to your audit log service
    if (window.APP_CONFIG?.API_BASE_URL) {
      fetch(`${window.APP_CONFIG.API_BASE_URL}/api/audit/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logEntry),
      }).catch(console.error);
    }
  }

  getThreatCount() {
    return this.threatCount;
  }

  getLogs(filter = {}) {
    let filteredLogs = this.logs;

    if (filter.category) {
      filteredLogs = filteredLogs.filter(
        (log) => log.category === filter.category
      );
    }

    if (filter.startDate) {
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.timestamp) >= new Date(filter.startDate)
      );
    }

    if (filter.endDate) {
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.timestamp) <= new Date(filter.endDate)
      );
    }

    return filteredLogs;
  }
}

// Make SecurityManager available globally
window.SecurityManager = SecurityManager;
