// api-service.js - API Service for AI Customer Service Platform

class APIService {
  constructor() {
    this.config = window.appConfig.getConfig();
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Make a request to the API with retry logic
   */
  async makeRequest(
    endpoint,
    options = {},
    retries = this.config.PERFORMANCE.MAX_RETRIES
  ) {
    const url = `${this.config.API_BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.PERFORMANCE.REQUEST_TIMEOUT
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": window.aiCustomerService?.currentUser || "anonymous",
          "X-Client-Version": this.config.VERSION,
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

      // Track successful API call
      window.performanceMonitor?.trackAPICall(
        endpoint,
        Date.now() - performance.now(),
        true
      );

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Track failed API call
      window.performanceMonitor?.trackAPICall(
        endpoint,
        Date.now() - performance.now(),
        false
      );

      if (retries > 0 && this.shouldRetry(error)) {
        console.log(
          `Retrying request to ${endpoint}... ${retries} attempts left`
        );
        await this.delay(this.getRetryDelay(retries));
        return this.makeRequest(endpoint, options, retries - 1);
      }

      const errorInfo = this.errorHandler.handleAPIError(error, endpoint);
      throw new Error(errorInfo.userMessage);
    }
  }

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
      baseDelay * Math.pow(2, this.config.PERFORMANCE.MAX_RETRIES - retryCount),
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

  // ========== CHAT METHODS ==========

  /**
   * Send a chat message to the AI
   */
  async chat(message, context = [], options = {}) {
    const payload = {
      message: message.trim(),
      userId: window.aiCustomerService?.currentUser,
      conversationContext: context,
      timestamp: new Date().toISOString(),
      ...options,
    };

    // Validate message length
    if (payload.message.length > this.config.CHAT.MAX_MESSAGE_LENGTH) {
      throw new Error(
        `Message too long. Maximum ${this.config.CHAT.MAX_MESSAGE_LENGTH} characters allowed.`
      );
    }

    return this.makeRequest("/api/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Stream chat response (for future implementation)
   */
  async chatStream(message, context = [], onChunk = () => {}) {
    // This would be implemented for streaming responses
    console.log("Streaming chat not yet implemented");
    return this.chat(message, context);
  }

  // ========== FILE METHODS ==========

  /**
   * Upload a file to the knowledge base
   */
  async uploadFile(formData, onProgress = null) {
    const url = `${this.config.API_BASE_URL}/api/upload`;
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
      xhr.setRequestHeader("X-Client-Version", this.config.VERSION);
      xhr.setRequestHeader("X-Session-ID", this.getSessionId());

      xhr.send(formData);
    });
  }

  /**
   * Get uploaded files list
   */
  async getUploadedFiles() {
    return this.makeRequest("/api/files");
  }

  /**
   * Delete an uploaded file
   */
  async deleteFile(fileId) {
    return this.makeRequest(`/api/files/${fileId}`, {
      method: "DELETE",
    });
  }

  // ========== KNOWLEDGE BASE METHODS ==========

  /**
   * Get knowledge base statistics
   */
  async getKnowledgeStats() {
    return this.makeRequest("/api/knowledge/stats");
  }

  /**
   * Search knowledge base
   */
  async searchKnowledge(query, options = {}) {
    return this.makeRequest("/api/knowledge/search", {
      method: "POST",
      body: JSON.stringify({
        query,
        ...options,
      }),
    });
  }

  /**
   * Get knowledge base chunks
   */
  async getKnowledgeChunks(limit = 50, offset = 0) {
    return this.makeRequest(
      `/api/knowledge/chunks?limit=${limit}&offset=${offset}`
    );
  }

  // ========== SYSTEM METHODS ==========

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const startTime = performance.now();
      const response = await fetch(`${this.config.API_BASE_URL}/api/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      const duration = performance.now() - startTime;

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        ...data,
        responseTime: duration,
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
    return this.makeRequest("/api/status");
  }

  /**
   * Get API usage statistics
   */
  async getUsageStats() {
    return this.makeRequest("/api/usage/stats");
  }

  // ========== ANALYTICS METHODS ==========

  /**
   * Log user interaction
   */
  async logInteraction(type, data = {}) {
    if (!this.config.FEATURES.ANALYTICS) {
      return;
    }

    const interactionData = {
      type,
      ...data,
      userId: window.aiCustomerService?.currentUser,
      sessionId: this.getSessionId(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    try {
      await fetch(`${this.config.API_BASE_URL}/api/analytics/interaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(interactionData),
      });
    } catch (error) {
      // Fail silently for analytics
      console.warn("Analytics logging failed:", error);
    }
  }

  /**
   * Log error to analytics
   */
  async logError(errorData) {
    if (!this.config.FEATURES.ANALYTICS) {
      return;
    }

    const enhancedErrorData = {
      ...errorData,
      userId: window.aiCustomerService?.currentUser,
      sessionId: this.getSessionId(),
      timestamp: new Date().toISOString(),
    };

    try {
      await fetch(`${this.config.API_BASE_URL}/api/analytics/error`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(enhancedErrorData),
      });
    } catch (error) {
      // Fail silently for error logging
      console.warn("Error logging failed:", error);
    }
  }

  // ========== CACHE METHODS ==========

  /**
   * Get cached response if available
   */
  getCachedResponse(key) {
    if (!this.config.PERFORMANCE.CACHE_TTL) return null;

    try {
      const cached = localStorage.getItem(`api_cache_${key}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);

      // Check if cache is still valid
      if (Date.now() - timestamp < this.config.PERFORMANCE.CACHE_TTL) {
        return data;
      } else {
        // Remove expired cache
        localStorage.removeItem(`api_cache_${key}`);
        return null;
      }
    } catch (error) {
      console.warn("Cache read failed:", error);
      return null;
    }
  }

  /**
   * Set cached response
   */
  setCachedResponse(key, data) {
    if (!this.config.PERFORMANCE.CACHE_TTL) return;

    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(`api_cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn("Cache write failed:", error);
    }
  }

  /**
   * Clear all cached responses
   */
  clearCache() {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("api_cache_"))
      .forEach((key) => localStorage.removeItem(key));
  }
}

// Make APIService available globally
window.APIService = APIService;
