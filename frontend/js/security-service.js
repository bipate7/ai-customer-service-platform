// frontend/js/security-service.js
class SecurityService {
  constructor() {
    this.suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /expression\s*\(/gi,
    ];

    this.init();
  }

  init() {
    // Setup CSP if not already set
    this.setupContentSecurityPolicy();

    // Add security headers check
    this.checkSecurityHeaders();
  }

  setupContentSecurityPolicy() {
    // Note: This should ideally be set by the server
    // This is a client-side fallback
    const meta = document.createElement("meta");
    meta.httpEquiv = "Content-Security-Policy";
    meta.content =
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
    document.head.appendChild(meta);
  }

  sanitizeInput(input) {
    if (typeof input !== "string") return input;

    let sanitized = input
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");

    // Remove suspicious patterns
    this.suspiciousPatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, "");
    });

    return sanitized.trim();
  }

  validateFile(file) {
    const errors = [];
    const config = window.APP_CONFIG?.getConfig();

    // Check file size
    if (file.size > config.SECURITY.MAX_FILE_SIZE) {
      errors.push(
        `File size exceeds ${
          config.SECURITY.MAX_FILE_SIZE / 1024 / 1024
        }MB limit`
      );
    }

    // Check file type
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();
    if (!config.SECURITY.ALLOWED_FILE_TYPES.includes(fileExtension)) {
      errors.push(`File type ${fileExtension} not allowed`);
    }

    // Check file name for path traversal
    if (
      file.name.includes("..") ||
      file.name.includes("/") ||
      file.name.includes("\\")
    ) {
      errors.push("Invalid file name");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  checkSecurityHeaders() {
    // Check if essential security headers are present
    fetch(window.location.href, { method: "HEAD" })
      .then((response) => {
        const headers = {
          "x-frame-options": response.headers.get("x-frame-options"),
          "x-content-type-options": response.headers.get(
            "x-content-type-options"
          ),
          "strict-transport-security": response.headers.get(
            "strict-transport-security"
          ),
        };

        if (window.APP_CONFIG?.isDevelopment()) {
          console.log("Security Headers:", headers);
        }
      })
      .catch(console.debug);
  }

  generateCSRFToken() {
    // Generate a simple CSRF token
    const token =
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem("csrf_token", token);
    return token;
  }

  validateCSRFToken(token) {
    const storedToken = sessionStorage.getItem("csrf_token");
    return token === storedToken;
  }

  // Input validation methods
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  }

  // Rate limiting helper
  setupAPIRateLimiting() {
    const requestQueue = new Map();
    const MAX_REQUESTS_PER_MINUTE = 60;

    return {
      canMakeRequest: (endpoint) => {
        const now = Date.now();
        const windowStart = now - 60000; // 1 minute

        if (!requestQueue.has(endpoint)) {
          requestQueue.set(endpoint, []);
        }

        const requests = requestQueue
          .get(endpoint)
          .filter((time) => time > windowStart);
        requestQueue.set(endpoint, requests);

        if (requests.length >= MAX_REQUESTS_PER_MINUTE) {
          return false;
        }

        requests.push(now);
        return true;
      },
    };
  }

  // Session security
  setupSessionSecurity() {
    // Clear sensitive data on page hide
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        // Page is hidden, clear sensitive data if needed
        this.clearSensitiveData();
      }
    });

    // Clear data before unload
    window.addEventListener("beforeunload", () => {
      this.clearSensitiveData();
    });
  }

  clearSensitiveData() {
    // Clear any sensitive data from memory
    // This is a basic implementation
    const sensitiveKeys = ["auth_token", "sensitive_user_data"];
    sensitiveKeys.forEach((key) => {
      sessionStorage.removeItem(key);
    });
  }

  // Security audit
  performSecurityAudit() {
    const audit = {
      timestamp: new Date().toISOString(),
      issues: [],
      warnings: [],
      passed: [],
    };

    // Check for mixed content
    if (window.location.protocol === "https:") {
      const insecureElements = document.querySelectorAll('[src^="http:"]');
      if (insecureElements.length > 0) {
        audit.issues.push(
          "Mixed content detected: Loading HTTP resources over HTTPS"
        );
      }
    }

    // Check for outdated libraries (basic check)
    if (typeof $ !== "undefined" && $.fn?.jquery) {
      const jqueryVersion = $.fn.jquery;
      if (jqueryVersion.startsWith("1.") || jqueryVersion.startsWith("2.")) {
        audit.warnings.push(
          `Outdated jQuery version detected: ${jqueryVersion}`
        );
      }
    }

    // Check if running in development with sensitive features
    if (window.APP_CONFIG?.isDevelopment()) {
      if (window.APP_CONFIG.getConfig().FEATURES.MULTI_MODEL) {
        audit.warnings.push("Multi-model feature enabled in development");
      }
    }

    return audit;
  }
}

// Initialize security service
window.SecurityService = SecurityService;
