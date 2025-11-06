// js/config.js
class ConfigManager {
  constructor() {
    this.config = {
      // API Configuration - FIXED URL
      API_BASE_URL: this.getAPIBaseURL(),

      // Environment
      ENVIRONMENT: this.getEnvironment(),

      // Version
      VERSION: "1.0.0",

      // AI Model Configuration - SIMPLIFIED FOR NOW
      AI_MODELS: {
        PRIMARY: {
          name: "gpt-3.5-turbo", // Changed to available model
          provider: "openai",
          maxTokens: 2000,
          temperature: 0.7,
          description: "Primary model for all tasks",
          enabled: true,
        },
      },

      // Feature Flags - SIMPLIFIED
      FEATURES: {
        VOICE_INPUT: this.isFeatureEnabled("voice_input"),
        FILE_UPLOAD: this.isFeatureEnabled("file_upload"),
        MULTI_MODEL: false, // Disabled for now
        ANALYTICS: this.isFeatureEnabled("analytics"),
        DARK_MODE: this.isFeatureEnabled("dark_mode"),
        // Disable advanced features for initial deployment
        SENTIMENT_ANALYSIS: false,
        REAL_TIME_TYPING: true,
        PERSONALIZATION: false,
        STREAMING_RESPONSES: false,
        CONTEXT_AWARENESS: true,
      },

      // Performance Settings
      PERFORMANCE: {
        REQUEST_TIMEOUT: 30000, // Increased timeout
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
        // Simplified UI features
        MODEL_SELECTOR: false,
        TYPING_INDICATORS: true,
        SENTIMENT_DISPLAY: false,
        RESPONSE_STREAMING: false,
        QUICK_SETTINGS: true,
      },

      // Chat Settings
      CHAT: {
        MAX_MESSAGE_LENGTH: 1000,
        MAX_HISTORY_LENGTH: 50,
        TYPING_INDICATOR: true,
        MESSAGE_TIMESTAMPS: true,
        CONTEXT_WINDOW: 10,
      },

      // Analytics & Monitoring
      ANALYTICS: {
        ENABLED: this.isFeatureEnabled("analytics"),
        TRACK_INTERACTIONS: true,
        TRACK_PERFORMANCE: true,
        TRACK_MODEL_USAGE: false, // Disabled for now
        TRACK_USER_PREFERENCES: false,
        TRACK_ERRORS: true,
        SAMPLE_RATE: 1.0,
        ANONYMIZE_DATA: true,
      },
    };

    // Load any persisted configuration
    this.loadPersistedConfig();

    // Log configuration in development
    this.logConfig();
  }

  getAPIBaseURL() {
    // Check if we're in development or production
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return "http://localhost:5000"; // Your local backend
    }

    // FIXED: Correct production backend URL
    return "https://ai-customer-service-backend.onrender.com";
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
        analytics: true,
        dark_mode: true,
      },
      staging: {
        voice_input: true,
        file_upload: true,
        analytics: true,
        dark_mode: true,
      },
      production: {
        voice_input: false, // Start with basic features
        file_upload: true,
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
    // Only persist UI and feature settings to localStorage
    localStorage.setItem(
      "app_config",
      JSON.stringify({
        UI: this.config.UI,
        FEATURES: this.config.FEATURES,
        CHAT: this.config.CHAT,
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

  // Get available models - simplified
  getAvailableModels() {
    // For now, only return primary model
    return { PRIMARY: this.config.AI_MODELS.PRIMARY };
  }

  // Get model by type
  getModelConfig(modelType) {
    return this.config.AI_MODELS[modelType] || this.config.AI_MODELS.PRIMARY;
  }

  // Check if a specific model is available
  isModelAvailable(modelType) {
    return modelType === "PRIMARY"; // Only primary model available for now
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
      console.groupEnd();
    } else {
      console.log("🚀 AI Customer Service Frontend Loaded");
      console.log("Backend URL:", this.config.API_BASE_URL);
    }
  }
}

// Create global instance and attach to window
window.ConfigManager = ConfigManager;
window.APP_CONFIG = new ConfigManager().getConfig();

// Log the configuration for debugging
console.log("🔧 Frontend Configuration:", window.APP_CONFIG);

// Export for module use
if (typeof module !== "undefined" && module.exports) {
  module.exports = ConfigManager;
}
