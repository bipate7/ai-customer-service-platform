// js/config.js
class ConfigManager {
  constructor() {
    this.config = {
      // API Configuration
      API_BASE_URL: this.getAPIBaseURL(),

      // Environment
      ENVIRONMENT: this.getEnvironment(),

      // Version
      VERSION: "1.0.0",

      // Feature Flags
      FEATURES: {
        VOICE_INPUT: this.isFeatureEnabled("voice_input"),
        FILE_UPLOAD: this.isFeatureEnabled("file_upload"),
        MULTI_MODEL: this.isFeatureEnabled("multi_model"),
        ANALYTICS: this.isFeatureEnabled("analytics"),
        DARK_MODE: this.isFeatureEnabled("dark_mode"),
      },

      // Performance Settings
      PERFORMANCE: {
        REQUEST_TIMEOUT: 10000,
        MAX_RETRIES: 3,
        CACHE_TTL: 300000, // 5 minutes
        DEBOUNCE_DELAY: 300,
        TYPING_INDICATOR_DELAY: 1000,
      },

      // Security Settings
      SECURITY: {
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_FILE_TYPES: [".pdf", ".docx", ".txt", ".md", ".csv"],
        RATE_LIMIT_REQUESTS: 100,
        RATE_LIMIT_WINDOW: 900000, // 15 minutes
        SESSION_TIMEOUT: 3600000, // 1 hour
      },

      // UI Settings
      UI: {
        THEME: this.getStoredTheme(),
        LANGUAGE: this.getStoredLanguage(),
        AUTO_SAVE: true,
        NOTIFICATIONS: true,
        SMOOTH_SCROLLING: true,
        ANIMATIONS: true,
      },

      // Chat Settings
      CHAT: {
        MAX_MESSAGE_LENGTH: 1000,
        MAX_HISTORY_LENGTH: 50,
        TYPING_INDICATOR: true,
        MESSAGE_TIMESTAMPS: true,
      },
    };
  }

  getAPIBaseURL() {
    // Check if we're in development or production
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return "http://localhost:3000"; // Your local development server
    }

    // Production - your Render backend URL
    return "https://ai-customer-service-backend-rthi.onrender.com";
  }

  getEnvironment() {
    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "development";
    }

    if (hostname.includes("staging") || hostname.includes("test")) {
      return "staging";
    }

    return "production";
  }

  isFeatureEnabled(feature) {
    // 1. Check URL parameters first (highest priority)
    const urlParams = new URLSearchParams(window.location.search);
    const featureParam = urlParams.get(feature);
    if (featureParam !== null) {
      return featureParam === "true" || featureParam === "1";
    }

    // 2. Check localStorage for feature flags
    const storedFlag = localStorage.getItem(`feature_${feature}`);
    if (storedFlag !== null) {
      return storedFlag === "true";
    }

    // 3. Environment-based default flags
    const environment = this.getEnvironment();
    const defaultFlags = {
      development: {
        voice_input: true,
        file_upload: true,
        multi_model: true,
        analytics: true,
        dark_mode: true,
      },
      staging: {
        voice_input: true,
        file_upload: true,
        multi_model: false,
        analytics: true,
        dark_mode: true,
      },
      production: {
        voice_input: true,
        file_upload: true,
        multi_model: false,
        analytics: true,
        dark_mode: true,
      },
    };

    return defaultFlags[environment]?.[feature] || false;
  }

  getStoredTheme() {
    return localStorage.getItem("app_theme") || "light";
  }

  getStoredLanguage() {
    return localStorage.getItem("app_language") || "en";
  }

  updateConfig(newConfig) {
    // Deep merge for nested objects
    const deepMerge = (target, source) => {
      for (const key in source) {
        if (source[key] instanceof Object && key in target) {
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
      return target;
    };

    this.config = deepMerge(this.config, newConfig);
    this.persistConfig();

    // Dispatch config update event
    window.dispatchEvent(
      new CustomEvent("configUpdated", {
        detail: this.config,
      })
    );
  }

  persistConfig() {
    // Only persist UI settings to localStorage
    localStorage.setItem(
      "app_config",
      JSON.stringify({
        UI: this.config.UI,
        FEATURES: this.config.FEATURES,
      })
    );
  }

  loadPersistedConfig() {
    try {
      const persisted = localStorage.getItem("app_config");
      if (persisted) {
        const parsed = JSON.parse(persisted);
        this.updateConfig(parsed);
      }
    } catch (error) {
      console.warn("Failed to load persisted config:", error);
    }
  }

  getConfig() {
    return this.config;
  }

  // Helper methods for specific config values
  getAPIEndpoint(endpoint) {
    return `${this.config.API_BASE_URL}${endpoint}`;
  }

  isDevelopment() {
    return this.config.ENVIRONMENT === "development";
  }

  isProduction() {
    return this.config.ENVIRONMENT === "production";
  }

  // Feature check helpers
  isVoiceInputEnabled() {
    return (
      this.config.FEATURES.VOICE_INPUT &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    );
  }

  isFileUploadEnabled() {
    return this.config.FEATURES.FILE_UPLOAD;
  }

  // Validation methods
  validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size > this.config.SECURITY.MAX_FILE_SIZE) {
      errors.push(
        `File size must be less than ${
          this.config.SECURITY.MAX_FILE_SIZE / 1024 / 1024
        }MB`
      );
    }

    // Check file type
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();
    if (!this.config.SECURITY.ALLOWED_FILE_TYPES.includes(fileExtension)) {
      errors.push(
        `File type not supported. Allowed types: ${this.config.SECURITY.ALLOWED_FILE_TYPES.join(
          ", "
        )}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateMessage(message) {
    return message.length <= this.config.CHAT.MAX_MESSAGE_LENGTH;
  }

  // Debug methods
  logConfig() {
    if (this.isDevelopment()) {
      console.group("📋 Application Configuration");
      console.log("Environment:", this.config.ENVIRONMENT);
      console.log("API Base URL:", this.config.API_BASE_URL);
      console.log("Features:", this.config.FEATURES);
      console.log("UI Settings:", this.config.UI);
      console.groupEnd();
    }
  }
}

// Create global instance
window.ConfigManager = ConfigManager;
