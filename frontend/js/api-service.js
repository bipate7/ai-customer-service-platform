// api-service.js - Enhanced API Service for AI Customer Service Platform - PHASE 7

class APIService {
  constructor() {
    this.config = window.appConfig?.getConfig() || window.APP_CONFIG;
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

  // ========== ENHANCED CHAT METHODS - PHASE 7 ==========

  /**
   * Send a chat message to the AI with multi-model support
   */
  async chat(message, context = [], options = {}) {
    const modelType =
      options.modelType || this.selectOptimalModel(message, context);
    const modelConfig = this.getModelConfig(modelType);

    const payload = {
      message: message.trim(),
      userId: window.aiCustomerService?.currentUser,
      conversationContext: context,
      timestamp: new Date().toISOString(),
      // PHASE 7: Enhanced payload with model information
      model: modelConfig.name,
      modelType: modelType,
      provider: modelConfig.provider,
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
      userPreferences: this.userPreferences,
      ...options,
    };

    // Validate message length
    if (payload.message.length > this.config.CHAT.MAX_MESSAGE_LENGTH) {
      throw new Error(
        `Message too long. Maximum ${this.config.CHAT.MAX_MESSAGE_LENGTH} characters allowed.`
      );
    }

    // PHASE 7: Add model-specific headers
    const headers = {
      "X-Model-Type": modelType,
      "X-Model-Provider": modelConfig.provider,
    };

    const response = await this.makeRequest("/api/chat", {
      method: "POST",
      body: JSON.stringify(payload),
      headers,
    });

    // PHASE 7: Update conversation context and user preferences
    this.updateConversationContext(message, response.response);
    this.updateUserPreferences(message, response.response, modelType);

    // PHASE 7: Track model usage
    this.trackModelUsage(
      modelType,
      message.length,
      response.response?.length || 0
    );

    return {
      ...response,
      modelUsed: modelType,
      modelConfig: modelConfig,
    };
  }

  /**
   * PHASE 7: Smart model selection based on query type and context
   */
  selectOptimalModel(message, context = []) {
    // If multi-model feature is disabled, use primary model
    if (!this.config.FEATURES?.MULTI_MODEL) {
      return "PRIMARY";
    }

    // User preference override
    if (
      this.userPreferences.preferredModel &&
      this.isModelAvailable(this.userPreferences.preferredModel)
    ) {
      return this.userPreferences.preferredModel;
    }

    // Auto-selection based on query content
    const queryLower = message.toLowerCase();

    // Code-related queries
    if (this.isCodeRelated(queryLower)) {
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

    // Context-heavy conversations
    if (context.length > 5) {
      return "PRIMARY"; // Use most capable model for complex conversations
    }

    // Default to primary model
    return "PRIMARY";
  }

  /**
   * PHASE 7: Query classification helpers
   */
  isCodeRelated(query) {
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
      "variable",
      "loop",
      "array",
      "object",
      "class",
      "function",
    ];
    return codeKeywords.some((keyword) => query.includes(keyword));
  }

  isSimpleQuery(query) {
    const simplePatterns = [
      /^(hello|hi|hey|greetings)/i,
      /^(thanks|thank you|thx)/i,
      /^(bye|goodbye|see you)/i,
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
      "invent",
      "fiction",
      "narrative",
      "plot",
      "character",
    ];

    const hasCreativeKeyword = creativeKeywords.some((keyword) =>
      query.includes(keyword)
    );
    const hasCreativeContext = context.some((msg) =>
      creativeKeywords.some((keyword) =>
        msg.message?.toLowerCase().includes(keyword)
      )
    );

    return hasCreativeKeyword || hasCreativeContext;
  }

  /**
   * PHASE 7: Get model configuration
   */
  getModelConfig(modelType) {
    const models = this.config.AI_MODELS || {};
    return (
      models[modelType] ||
      models.PRIMARY || {
        name: "gpt-3.5-turbo",
        provider: "openai",
        maxTokens: 2000,
        temperature: 0.7,
      }
    );
  }

  /**
   * PHASE 7: Check if model is available
   */
  isModelAvailable(modelType) {
    const model = this.config.AI_MODELS?.[modelType];
    return model && model.enabled !== false;
  }

  /**
   * PHASE 7: Get available models
   */
  getAvailableModels() {
    if (!this.config.AI_MODELS || !this.config.FEATURES?.MULTI_MODEL) {
      return { PRIMARY: this.getModelConfig("PRIMARY") };
    }

    const availableModels = {};
    Object.keys(this.config.AI_MODELS).forEach((key) => {
      if (this.isModelAvailable(key)) {
        availableModels[key] = this.config.AI_MODELS[key];
      }
    });

    return availableModels;
  }

  /**
   * PHASE 7: Update conversation context
   */
  updateConversationContext(userMessage, aiResponse) {
    // Add to context (respecting max history length)
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

    // Trim context if it exceeds maximum
    const maxHistory = this.config.CHAT?.CONTEXT_WINDOW || 10;
    if (this.conversationContext.length > maxHistory * 2) {
      this.conversationContext = this.conversationContext.slice(
        -maxHistory * 2
      );
    }
  }

  /**
   * PHASE 7: Get current conversation context
   */
  getConversationContext() {
    return this.conversationContext;
  }

  /**
   * PHASE 7: Clear conversation context
   */
  clearConversationContext() {
    this.conversationContext = [];
  }

  // ========== PERSONALIZATION METHODS - PHASE 7 ==========

  /**
   * PHASE 7: Load user preferences
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
   * PHASE 7: Save user preferences
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

  /**
   * PHASE 7: Update user preferences based on interaction
   */
  updateUserPreferences(userMessage, aiResponse, modelType) {
    if (!this.config.FEATURES?.PERSONALIZATION) return;

    const preferenceUpdate = {
      lastInteraction: new Date().toISOString(),
      preferredTone: this.detectPreferredTone(aiResponse),
      topicPreferences: this.extractTopics(userMessage),
      interactionCount: (this.userPreferences.interactionCount || 0) + 1,
      preferredResponseLength: this.estimatePreferredLength(aiResponse),
    };

    // Learn model preference based on satisfaction (simplified)
    if (this.isSatisfyingResponse(aiResponse, userMessage)) {
      preferenceUpdate.preferredModel = modelType;
    }

    this.saveUserPreferences(preferenceUpdate);
  }

  /**
   * PHASE 7: Detect user's preferred tone from responses
   */
  detectPreferredTone(response) {
    // Simple tone detection - can be enhanced
    if (
      response.includes("!") ||
      response.includes("😊") ||
      response.includes("🎉")
    ) {
      return "friendly";
    } else if (response.length < 100) {
      return "concise";
    } else if (response.includes("**") || response.split("\n").length > 5) {
      return "detailed";
    }
    return "professional";
  }

  /**
   * PHASE 7: Extract topics from user message
   */
  extractTopics(message) {
    const topics = [];
    const topicKeywords = {
      technical: ["error", "bug", "code", "api", "technical", "debug"],
      billing: [
        "price",
        "payment",
        "billing",
        "subscription",
        "refund",
        "cost",
      ],
      support: ["help", "support", "contact", "assistance", "question"],
      feature: ["feature", "function", "capability", "can it", "does it"],
      creative: ["write", "create", "generate", "story", "poem", "idea"],
    };

    Object.keys(topicKeywords).forEach((topic) => {
      if (
        topicKeywords[topic].some((keyword) =>
          message.toLowerCase().includes(keyword)
        )
      ) {
        topics.push(topic);
      }
    });

    return [...new Set(topics)]; // Remove duplicates
  }

  /**
   * PHASE 7: Estimate preferred response length
   */
  estimatePreferredLength(response) {
    const length = response.length;
    if (length < 100) return "short";
    if (length < 500) return "medium";
    return "long";
  }

  /**
   * PHASE 7: Simple satisfaction detection
   */
  isSatisfyingResponse(aiResponse, userMessage) {
    // Simplified satisfaction detection
    const positiveIndicators = [
      "thanks",
      "thank you",
      "great",
      "perfect",
      "awesome",
      "excellent",
    ];
    const negativeIndicators = [
      "no",
      "not",
      "wrong",
      "incorrect",
      "bad",
      "terrible",
    ];

    // In a real implementation, this would use more sophisticated analysis
    return (
      aiResponse.length > 10 &&
      !negativeIndicators.some((indicator) =>
        userMessage.toLowerCase().includes(indicator)
      )
    );
  }

  // ========== SENTIMENT ANALYSIS - PHASE 7 ==========

  /**
   * PHASE 7: Analyze sentiment of text
   */
  async analyzeSentiment(text) {
    if (!this.config.FEATURES?.SENTIMENT_ANALYSIS) {
      return null;
    }

    try {
      const response = await this.makeRequest("/api/analyze/sentiment", {
        method: "POST",
        body: JSON.stringify({ text }),
      });

      return response;
    } catch (error) {
      console.warn("Sentiment analysis failed:", error);
      return null;
    }
  }

  // ========== ENHANCED STREAMING CHAT - PHASE 7 ==========

  /**
   * PHASE 7: Stream chat response with real-time updates
   */
  async chatStream(message, context = [], onChunk = () => {}, options = {}) {
    if (!this.config.FEATURES?.STREAMING_RESPONSES) {
      // Fallback to regular chat
      const response = await this.chat(message, context, options);
      onChunk(response.response);
      return response;
    }

    const modelType =
      options.modelType || this.selectOptimalModel(message, context);
    const modelConfig = this.getModelConfig(modelType);

    const payload = {
      message: message.trim(),
      userId: window.aiCustomerService?.currentUser,
      conversationContext: context,
      stream: true,
      model: modelConfig.name,
      modelType: modelType,
      userPreferences: this.userPreferences,
      ...options,
    };

    try {
      const response = await fetch(
        `${this.config.API_BASE_URL}/api/chat/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": window.aiCustomerService?.currentUser || "anonymous",
            "X-Model-Type": modelType,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Streaming request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullResponse += data.content;
                onChunk(fullResponse, data.content);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      // Update context and preferences
      this.updateConversationContext(message, fullResponse);
      this.updateUserPreferences(message, fullResponse, modelType);
      this.trackModelUsage(modelType, message.length, fullResponse.length);

      return {
        response: fullResponse,
        modelUsed: modelType,
        streamed: true,
      };
    } catch (error) {
      console.error("Streaming chat failed:", error);
      // Fallback to regular chat
      return this.chat(message, context, options);
    }
  }

  // ========== ANALYTICS ENHANCEMENTS - PHASE 7 ==========

  /**
   * PHASE 7: Track model usage for analytics
   */
  async trackModelUsage(modelType, inputLength, outputLength) {
    if (!this.config.FEATURES?.ANALYTICS) return;

    const usageData = {
      modelType,
      inputLength,
      outputLength,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
    };

    try {
      await this.logInteraction("model_usage", usageData);
    } catch (error) {
      console.warn("Model usage tracking failed:", error);
    }
  }

  /**
   * PHASE 7: Enhanced interaction logging
   */
  async logInteraction(type, data = {}) {
    if (!this.config.FEATURES?.ANALYTICS) {
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
      // PHASE 7: Additional context
      userPreferences: this.userPreferences,
      conversationLength: this.conversationContext.length,
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

  // ========== EXISTING METHODS (Unchanged) ==========

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

  // ========== FILE METHODS (Unchanged) ==========

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

  // ========== KNOWLEDGE BASE METHODS (Unchanged) ==========

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

  // ========== SYSTEM METHODS (Unchanged) ==========

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

  // ========== CACHE METHODS (Unchanged) ==========

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
