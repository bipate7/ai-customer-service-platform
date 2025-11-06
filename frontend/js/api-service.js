// api-service.js - Fixed API Service for AI Customer Service Platform

class APIService {
  constructor() {
    this.config = window.appConfig?.getConfig() ||
      window.APP_CONFIG || {
        API_BASE_URL: "https://ai-customer-service-backend-rthi.onrender.com",
        PERFORMANCE: {
          MAX_RETRIES: 3,
          REQUEST_TIMEOUT: 30000,
        },
        CHAT: {
          MAX_MESSAGE_LENGTH: 1000,
        },
        VERSION: "1.0",
      };
    this.errorHandler = new ErrorHandler();
    this.userPreferences = this.loadUserPreferences();
    this.conversationContext = [];
  }

  /**
   * Make a request to the API with retry logic
   */
  async makeRequest(
    endpoint,
    options = {},
    retries = this.config.PERFORMANCE.MAX_RETRIES || 3
  ) {
    // FIX: Use correct backend URL without /api prefix
    const url = `${this.config.API_BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.PERFORMANCE.REQUEST_TIMEOUT || 30000
    );

    try {
      console.log(`🔄 Making request to: ${url}`);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": window.aiCustomerService?.currentUser || "anonymous",
          "X-Client-Version": this.config.VERSION || "1.0",
          "X-Session-ID": this.getSessionId(),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 401) {
          throw new Error("401: Authentication required");
        } else if (response.status === 403) {
          throw new Error("403: Access forbidden");
        } else if (response.status === 429) {
          throw new Error("429: Rate limit exceeded");
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log(`✅ API Response:`, data);

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (retries > 0 && this.shouldRetry(error)) {
        console.log(
          `Retrying request to ${endpoint}... ${retries} attempts left`
        );
        await this.delay(this.getRetryDelay(retries));
        return this.makeRequest(endpoint, options, retries - 1);
      }

      // FIX: Use simple error handling instead of missing method
      const errorMessage = this.handleAPIError(error, endpoint);
      throw new Error(errorMessage);
    }
  }

  /**
   * Simple error handling - replaces missing ErrorHandler
   */
  handleAPIError(error, endpoint) {
    console.error(`API Error for ${endpoint}:`, error);

    if (error.name === "AbortError") {
      return "Request timeout. Please try again.";
    } else if (error.message.includes("Failed to fetch")) {
      return "Network error. Please check your connection.";
    } else if (error.message.includes("401")) {
      return "Authentication required.";
    } else if (error.message.includes("429")) {
      return "Too many requests. Please wait a moment.";
    } else if (error.message.includes("500")) {
      return "Server error. Please try again later.";
    } else {
      return "An unexpected error occurred. Please try again.";
    }
  }

  // ========== SIMPLIFIED CHAT METHODS ==========

  /**
   * Send a chat message to the AI (simplified)
   */
  async chat(message, context = [], options = {}) {
    // FIX: Use correct endpoint - /chat instead of /api/chat
    const payload = {
      message: message.trim(),
      user_id: window.aiCustomerService?.currentUser || "anonymous",
      conversation_context: context,
    };

    // Validate message length
    const maxLength = this.config.CHAT?.MAX_MESSAGE_LENGTH || 1000;
    if (payload.message.length > maxLength) {
      throw new Error(
        `Message too long. Maximum ${maxLength} characters allowed.`
      );
    }

    console.log(`📨 Sending chat message:`, payload);

    try {
      const response = await this.makeRequest("/chat", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      console.log(`🤖 Chat response:`, response);

      // Update conversation context
      this.updateConversationContext(message, response.response);

      return response;
    } catch (error) {
      console.error("Chat request failed:", error);
      throw error;
    }
  }

  /**
   * Update conversation context
   */
  updateConversationContext(userMessage, aiResponse) {
    // Add to context
    this.conversationContext.push(
      {
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
      {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toISOString(),
      }
    );

    // Trim context if it exceeds maximum (keep last 10 exchanges)
    const maxHistory = 10;
    if (this.conversationContext.length > maxHistory * 2) {
      this.conversationContext = this.conversationContext.slice(
        -maxHistory * 2
      );
    }
  }

  /**
   * Get current conversation context
   */
  getConversationContext() {
    return this.conversationContext;
  }

  /**
   * Clear conversation context
   */
  clearConversationContext() {
    this.conversationContext = [];
  }

  // ========== PERSONALIZATION METHODS ==========

  /**
   * Load user preferences
   */
  loadUserPreferences() {
    try {
      return JSON.parse(localStorage.getItem("ai_user_preferences") || "{}");
    } catch (error) {
      console.warn("Failed to load user preferences:", error);
      return {};
    }
  }

  /**
   * Save user preferences
   */
  saveUserPreferences(preferences) {
    this.userPreferences = { ...this.userPreferences, ...preferences };
    try {
      localStorage.setItem(
        "ai_user_preferences",
        JSON.stringify(this.userPreferences)
      );
    } catch (error) {
      console.warn("Failed to save user preferences:", error);
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Determine if a request should be retried
   */
  shouldRetry(error) {
    const retryableErrors = [
      "AbortError",
      "Failed to fetch",
      "NetworkError",
      "Network request failed",
      "ECONNRESET",
      "ETIMEDOUT",
    ];

    const retryableStatuses = [408, 429, 500, 502, 503, 504];

    return (
      retryableErrors.some(
        (retryError) =>
          error.name === retryError || error.message.includes(retryError)
      ) ||
      retryableStatuses.some((status) =>
        error.message.includes(status.toString())
      )
    );
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  getRetryDelay(retryCount) {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(
      baseDelay *
        Math.pow(2, (this.config.PERFORMANCE.MAX_RETRIES || 3) - retryCount),
      maxDelay
    );

    // Add jitter to avoid thundering herd problem
    const jitter = delay * 0.1 * Math.random();
    return delay + jitter;
  }

  /**
   * Delay execution
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate a session ID for tracking
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem("session_id");
    if (!sessionId) {
      sessionId =
        "session-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem("session_id", sessionId);
    }
    return sessionId;
  }

  // ========== FILE METHODS ==========

  /**
   * Upload a file to the knowledge base
   */
  async uploadFile(formData, onProgress = null) {
    // FIX: Use correct endpoint
    const url = `${this.config.API_BASE_URL}/upload`;
    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error("Invalid response from server"));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed due to network error"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload was cancelled"));
      });

      xhr.open("POST", url);

      // Set custom headers
      xhr.setRequestHeader(
        "X-User-ID",
        window.aiCustomerService?.currentUser || "anonymous"
      );
      xhr.setRequestHeader("X-Client-Version", this.config.VERSION || "1.0");
      xhr.setRequestHeader("X-Session-ID", this.getSessionId());

      xhr.send(formData);
    });
  }

  /**
   * Get uploaded files list
   */
  async getUploadedFiles() {
    // FIX: Use correct endpoint
    return this.makeRequest("/files");
  }

  // ========== SYSTEM METHODS ==========

  /**
   * Health check
   */
  async healthCheck() {
    try {
      // FIX: Use correct endpoint
      const response = await this.makeRequest("/health");
      return {
        ...response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus() {
    // FIX: Use correct endpoint or remove if not implemented
    return this.makeRequest("/health");
  }
}

// FIX: Add missing ErrorHandler class
class ErrorHandler {
  handleAPIError(error, endpoint) {
    console.error(`API Error for ${endpoint}:`, error);

    if (error.name === "AbortError") {
      return "Request timeout. Please try again.";
    } else if (error.message.includes("Failed to fetch")) {
      return "Network error. Please check your connection.";
    } else if (error.message.includes("401")) {
      return "Authentication required.";
    } else if (error.message.includes("429")) {
      return "Too many requests. Please wait a moment.";
    } else if (error.message.includes("500")) {
      return "Server error. Please try again later.";
    } else {
      return "An unexpected error occurred. Please try again.";
    }
  }
}

// Make APIService available globally
window.APIService = APIService;

// Initialize default configuration if not exists
if (!window.APP_CONFIG) {
  window.APP_CONFIG = {
    API_BASE_URL: "https://ai-customer-service-backend.onrender.com",
    PERFORMANCE: {
      MAX_RETRIES: 3,
      REQUEST_TIMEOUT: 30000,
    },
    CHAT: {
      MAX_MESSAGE_LENGTH: 1000,
    },
    VERSION: "1.0",
  };
}

console.log("✅ APIService loaded with configuration:", window.APP_CONFIG);
