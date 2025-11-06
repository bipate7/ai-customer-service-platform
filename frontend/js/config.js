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

      // AI Model Configuration - NEW FOR PHASE 7
      AI_MODELS: {
        PRIMARY: {
          name: "gpt-4",
          provider: "openai",
          maxTokens: 4000,
          temperature: 0.7,
          description: "Most capable model for complex tasks",
          enabled: true,
        },
        FAST: {
          name: "gpt-3.5-turbo",
          provider: "openai",
          maxTokens: 2000,
          temperature: 0.7,
          description: "Fast and efficient for simple queries",
          enabled: true,
        },
        CODE: {
          name: "claude-instant",
          provider: "anthropic",
          maxTokens: 4000,
          temperature: 0.3,
          description: "Optimized for code and technical content",
          enabled: this.isFeatureEnabled("code_model"),
        },
        CREATIVE: {
          name: "claude-2",
          provider: "anthropic",
          maxTokens: 4000,
          temperature: 0.9,
          description: "Creative writing and brainstorming",
          enabled: this.isFeatureEnabled("creative_model"),
        },
      },

      // Model Selection Rules - NEW FOR PHASE 7
      MODEL_SELECTION: {
        AUTO_SELECTION: true,
        FALLBACK_MODEL: "FAST",
        USER_OVERRIDE: true,
        CONTEXT_AWARE: true,
        PERFORMANCE_OPTIMIZED: true,
      },

      // Feature Flags
      FEATURES: {
        VOICE_INPUT: this.isFeatureEnabled("voice_input"),
        FILE_UPLOAD: this.isFeatureEnabled("file_upload"),
        MULTI_MODEL: this.isFeatureEnabled("multi_model"),
        ANALYTICS: this.isFeatureEnabled("analytics"),
        DARK_MODE: this.isFeatureEnabled("dark_mode"),
        // NEW FEATURES FOR PHASE 7
        SENTIMENT_ANALYSIS: this.isFeatureEnabled("sentiment_analysis"),
        REAL_TIME_TYPING: this.isFeatureEnabled("real_time_typing"),
        PERSONALIZATION: this.isFeatureEnabled("personalization"),
        STREAMING_RESPONSES: this.isFeatureEnabled("streaming_responses"),
        CONTEXT_AWARENESS: this.isFeatureEnabled("context_awareness"),
      },

      // Performance Settings
      PERFORMANCE: {
        REQUEST_TIMEOUT: 10000,
        MAX_RETRIES: 3,
        CACHE_TTL: 300000, // 5 minutes
        DEBOUNCE_DELAY: 300,
        TYPING_INDICATOR_DELAY: 1000,
        // NEW FOR PHASE 7
        STREAMING_CHUNK_DELAY: 50,
        MODEL_SWITCH_TIMEOUT: 2000,
        TYPING_SPEED: 30, // ms per character
        SESSION_REFRESH_INTERVAL: 300000, // 5 minutes
      },

      // Security Settings
      SECURITY: {
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_FILE_TYPES: [".pdf", ".docx", ".txt", ".md", ".csv"],
        RATE_LIMIT_REQUESTS: 100,
        RATE_LIMIT_WINDOW: 900000, // 15 minutes
        SESSION_TIMEOUT: 3600000, // 1 hour
        // NEW FOR PHASE 7
        MODEL_ACCESS_CONTROL: true,
        CONTENT_FILTERING: true,
        PRIVACY_MODE: false,
      },

      // UI Settings
      UI: {
        THEME: this.getStoredTheme(),
        LANGUAGE: this.getStoredLanguage(),
        AUTO_SAVE: true,
        NOTIFICATIONS: true,
        SMOOTH_SCROLLING: true,
        ANIMATIONS: true,
        // NEW FOR PHASE 7
        MODEL_SELECTOR: true,
        TYPING_INDICATORS: true,
        SENTIMENT_DISPLAY: true,
        RESPONSE_STREAMING: true,
        QUICK_SETTINGS: true,
      },

      // Chat Settings
      CHAT: {
        MAX_MESSAGE_LENGTH: 1000,
        MAX_HISTORY_LENGTH: 50,
        TYPING_INDICATOR: true,
        MESSAGE_TIMESTAMPS: true,
        // NEW FOR PHASE 7
        CONTEXT_WINDOW: 10, // Last 10 messages for context
        PERSONALIZATION_MEMORY: true,
        SENTIMENT_TRACKING: true,
        MODEL_PREFERENCES: true,
        AUTO_MODEL_SWITCHING: true,
      },

      // Analytics & Monitoring - ENHANCED FOR PHASE 7
      ANALYTICS: {
        ENABLED: this.isFeatureEnabled("analytics"),
        TRACK_INTERACTIONS: true,
        TRACK_PERFORMANCE: true,
        TRACK_MODEL_USAGE: true,
        TRACK_USER_PREFERENCES: true,
        TRACK_ERRORS: true,
        SAMPLE_RATE: 1.0, // 100% in development, lower in production
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
      return "http://localhost:5000"; // Your local development server
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
        // PHASE 7 FEATURES
        sentiment_analysis: true,
        real_time_typing: true,
        personalization: true,
        streaming_responses: true,
        context_awareness: true,
        code_model: true,
        creative_model: true,
      },
      staging: {
        voice_input: true,
        file_upload: true,
        multi_model: true,
        analytics: true,
        dark_mode: true,
        // PHASE 7 FEATURES
        sentiment_analysis: true,
        real_time_typing: true,
        personalization: false,
        streaming_responses: true,
        context_awareness: true,
        code_model: true,
        creative_model: false,
      },
      production: {
        voice_input: true,
        file_upload: true,
        multi_model: false, // Start disabled in production
        analytics: true,
        dark_mode: true,
        // PHASE 7 FEATURES
        sentiment_analysis: false,
        real_time_typing: true,
        personalization: false,
        streaming_responses: true,
        context_awareness: true,
        code_model: false,
        creative_model: false,
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

  // NEW METHODS FOR PHASE 7 - AI Model Management

  // Get available models based on feature flags and environment
  getAvailableModels() {
    const models = {};

    Object.keys(this.config.AI_MODELS).forEach((modelKey) => {
      const model = this.config.AI_MODELS[modelKey];
      if (model.enabled && this.config.FEATURES.MULTI_MODEL) {
        models[modelKey] = model;
      }
    });

    // If multi-model is disabled, only return the primary model
    if (!this.config.FEATURES.MULTI_MODEL) {
      return { PRIMARY: this.config.AI_MODELS.PRIMARY };
    }

    return models;
  }

  // Get model by type
  getModelConfig(modelType) {
    return this.config.AI_MODELS[modelType] || this.config.AI_MODELS.PRIMARY;
  }

  // Check if a specific model is available
  isModelAvailable(modelType) {
    const model = this.config.AI_MODELS[modelType];
    return model && model.enabled && this.config.FEATURES.MULTI_MODEL;
  }

  // Get optimal model for query type
  getOptimalModelForQuery(query, context = []) {
    if (!this.config.FEATURES.MULTI_MODEL) {
      return "PRIMARY";
    }

    const queryLower = query.toLowerCase();

    // Code-related queries
    if (this.isCodeQuery(queryLower)) {
      return this.isModelAvailable("CODE") ? "CODE" : "PRIMARY";
    }

    // Simple/quick queries
    if (this.isSimpleQuery(queryLower)) {
      return this.isModelAvailable("FAST") ? "FAST" : "PRIMARY";
    }

    // Creative queries
    if (this.isCreativeQuery(queryLower, context)) {
      return this.isModelAvailable("CREATIVE") ? "CREATIVE" : "PRIMARY";
    }

    // Default to primary model
    return "PRIMARY";
  }

  // Query classification helpers
  isCodeQuery(query) {
    const codeKeywords = [
      "code",
      "programming",
      "function",
      "api",
      "debug",
      "error",
      "syntax",
      "git",
      "github",
      "terminal",
      "command",
      "script",
      "javascript",
      "python",
      "java",
      "html",
      "css",
      "react",
      "node",
    ];
    return codeKeywords.some((keyword) => query.includes(keyword));
  }

  isSimpleQuery(query) {
    const simplePatterns = [
      /hello|hi|hey/i,
      /thanks|thank you/i,
      /bye|goodbye/i,
      /how are you/i,
      /what time/i,
      /weather/i,
      /^.{0,50}$/, // Short messages
    ];
    return simplePatterns.some((pattern) => pattern.test(query));
  }

  isCreativeQuery(query, context) {
    const creativeKeywords = [
      "creative",
      "story",
      "poem",
      "idea",
      "brainstorm",
      "imagine",
      "what if",
      "write a",
      "compose",
      "generate",
      "create",
    ];

    const hasCreativeKeyword = creativeKeywords.some((keyword) =>
      query.includes(keyword)
    );
    const hasLongContext = context.length > 3;

    return hasCreativeKeyword || hasLongContext;
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

  // NEW FEATURE CHECKS FOR PHASE 7
  isSentimentAnalysisEnabled() {
    return this.config.FEATURES.SENTIMENT_ANALYSIS;
  }

  isRealTimeTypingEnabled() {
    return this.config.FEATURES.REAL_TIME_TYPING;
  }

  isPersonalizationEnabled() {
    return this.config.FEATURES.PERSONALIZATION;
  }

  isStreamingEnabled() {
    return this.config.FEATURES.STREAMING_RESPONSES;
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
      console.group("📋 Application Configuration - PHASE 7");
      console.log("Environment:", this.config.ENVIRONMENT);
      console.log("API Base URL:", this.config.API_BASE_URL);
      console.log("Multi-Model Enabled:", this.config.FEATURES.MULTI_MODEL);
      console.log("Available Models:", Object.keys(this.getAvailableModels()));
      console.log("Features:", this.config.FEATURES);
      console.log("UI Settings:", this.config.UI);
      console.groupEnd();
    }
  }

  // NEW: Export configuration for external use
  exportConfig() {
    return {
      ...this.config,
      // Remove sensitive information
      API_BASE_URL: undefined,
      SECURITY: undefined,
    };
  }
}

// Create global instance and attach to window
window.ConfigManager = ConfigManager;
window.APP_CONFIG = new ConfigManager().getConfig();

// Export for module use
if (typeof module !== "undefined" && module.exports) {
  module.exports = ConfigManager;
}
