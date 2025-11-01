// AI Customer Service Platform - Complete Production Version

// Configuration Manager
class ConfigManager {
  constructor() {
    this.config = {
      API_BASE_URL: "https://ai-customer-service-backend-rthi.onrender.com",
      ENVIRONMENT: this.getEnvironment(),
      VERSION: "1.0.0",
      FEATURES: {
        VOICE_INPUT: true,
        FILE_UPLOAD: true,
        ANALYTICS: true,
      },
      PERFORMANCE: {
        REQUEST_TIMEOUT: 10000,
        MAX_RETRIES: 3,
        TYPING_INDICATOR_DELAY: 1000,
      },
      SECURITY: {
        MAX_FILE_SIZE: 10 * 1024 * 1024,
        ALLOWED_FILE_TYPES: [".pdf", ".docx", ".txt", ".md", ".csv"],
      },
      UI: {
        THEME: this.getStoredTheme(),
        AUTO_SAVE: true,
      },
      CHAT: {
        MAX_MESSAGE_LENGTH: 1000,
        MAX_HISTORY_LENGTH: 50,
      },
    };
  }

  getEnvironment() {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "development";
    }
    return "production";
  }

  getStoredTheme() {
    return localStorage.getItem("app_theme") || "light";
  }

  getConfig() {
    return this.config;
  }

  validateFile(file) {
    const errors = [];

    if (file.size > this.config.SECURITY.MAX_FILE_SIZE) {
      errors.push(
        `File size must be less than ${
          this.config.SECURITY.MAX_FILE_SIZE / 1024 / 1024
        }MB`
      );
    }

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
}

// Error Handler
class ErrorHandler {
  constructor() {
    this.initializeErrorHandling();
  }

  initializeErrorHandling() {
    window.addEventListener("error", (event) => {
      this.logError("Global Error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.logError("Unhandled Promise Rejection", {
        reason: event.reason,
        promise: event.promise,
      });
    });
  }

  logError(type, data) {
    const errorData = {
      type,
      ...data,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    console.error(`[${type}]`, errorData);

    if (window.appConfig?.getConfig().ENVIRONMENT === "production") {
      this.sendToLoggingService(errorData).catch(console.error);
    }
  }

  async sendToLoggingService(data) {
    try {
      await fetch(`${window.appConfig.getConfig().API_BASE_URL}/api/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.warn("Logging service unavailable:", error);
    }
  }

  handleAPIError(error, context) {
    const errorMap = {
      "Failed to fetch": {
        userMessage:
          "Network connection failed. Please check your internet connection.",
        action: "retry",
      },
      AbortError: {
        userMessage: "Request timed out. Please try again.",
        action: "retry",
      },
      404: {
        userMessage: "The requested resource was not found.",
        action: "contact_support",
      },
      500: {
        userMessage: "Server error. Our team has been notified.",
        action: "contact_support",
      },
    };

    const errorInfo = errorMap[error.message] ||
      errorMap[error.name] || {
        userMessage: "An unexpected error occurred. Please try again.",
        action: "retry",
      };

    this.logError("API Error", {
      context,
      error: error.message,
      userMessage: errorInfo.userMessage,
      action: errorInfo.action,
    });

    return errorInfo;
  }
}

// API Service
class APIService {
  constructor() {
    this.config = window.appConfig.getConfig();
    this.errorHandler = new ErrorHandler();
  }

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
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (retries > 0 && this.shouldRetry(error)) {
        console.log(`Retrying request... ${retries} attempts left`);
        await this.delay(this.getRetryDelay(retries));
        return this.makeRequest(endpoint, options, retries - 1);
      }

      const errorInfo = this.errorHandler.handleAPIError(error, endpoint);
      throw new Error(errorInfo.userMessage);
    }
  }

  shouldRetry(error) {
    return (
      error.name === "AbortError" ||
      error.message.includes("Failed to fetch") ||
      error.message.includes("500")
    );
  }

  getRetryDelay(retryCount) {
    return Math.min(
      1000 * Math.pow(2, this.config.PERFORMANCE.MAX_RETRIES - retryCount),
      10000
    );
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async chat(message, context = []) {
    return this.makeRequest("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        userId: window.aiCustomerService?.currentUser,
        conversationContext: context,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  async uploadFile(formData) {
    return this.makeRequest("/api/upload", {
      method: "POST",
      body: formData,
    });
  }

  async getKnowledgeStats() {
    return this.makeRequest("/api/knowledge/stats");
  }

  async healthCheck() {
    return this.makeRequest("/api/health", {
      method: "GET",
    });
  }
}

// Performance Monitor
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoadTime: 0,
      apiResponseTimes: [],
      userInteractions: [],
      errors: [],
    };

    this.initializeMonitoring();
  }

  initializeMonitoring() {
    window.addEventListener("load", () => {
      this.metrics.pageLoadTime = performance.now();
      this.reportMetric("page_load", this.metrics.pageLoadTime);
    });

    document.addEventListener("click", (event) => {
      this.trackInteraction("click", event.target);
    });

    document.addEventListener("visibilitychange", () => {
      this.reportMetric("visibility_change", {
        hidden: document.hidden,
        timestamp: Date.now(),
      });
    });

    setInterval(() => this.performHealthCheck(), 30000);
  }

  trackAPICall(endpoint, duration, success = true) {
    const metric = {
      endpoint,
      duration,
      success,
      timestamp: Date.now(),
    };

    this.metrics.apiResponseTimes.push(metric);

    if (duration > 5000) {
      this.reportMetric("slow_api_call", metric);
    }
  }

  trackInteraction(type, element) {
    const interaction = {
      type,
      element: element.tagName,
      id: element.id || null,
      classes: element.className || null,
      timestamp: Date.now(),
    };

    this.metrics.userInteractions.push(interaction);

    if (this.metrics.userInteractions.length > 100) {
      this.metrics.userInteractions.shift();
    }
  }

  async performHealthCheck() {
    try {
      const startTime = performance.now();
      const response = await fetch(
        `${window.appConfig.getConfig().API_BASE_URL}/api/health`
      );
      const duration = performance.now() - startTime;

      this.trackAPICall("/api/health", duration, response.ok);

      if (!response.ok) {
        this.reportMetric("health_check_failed", {
          status: response.status,
          duration,
        });
      }
    } catch (error) {
      this.reportMetric("health_check_error", {
        error: error.message,
      });
    }
  }

  reportMetric(type, data) {
    const metricData = {
      type,
      data,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      sessionId: window.aiCustomerService?.currentUser,
    };

    if (window.appConfig.getConfig().ENVIRONMENT === "production") {
      this.sendToAnalytics(metricData).catch(console.error);
    }

    console.log(`[Metric] ${type}:`, metricData);
  }

  async sendToAnalytics(data) {
    try {
      await fetch(
        `${window.appConfig.getConfig().API_BASE_URL}/api/analytics`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      console.warn("Analytics service unavailable:", error);
    }
  }

  getPerformanceReport() {
    const avgResponseTime =
      this.metrics.apiResponseTimes.length > 0
        ? this.metrics.apiResponseTimes.reduce(
            (sum, metric) => sum + metric.duration,
            0
          ) / this.metrics.apiResponseTimes.length
        : 0;

    return {
      pageLoadTime: this.metrics.pageLoadTime,
      averageResponseTime: avgResponseTime,
      totalInteractions: this.metrics.userInteractions.length,
      totalAPICalls: this.metrics.apiResponseTimes.length,
      errorCount: this.metrics.errors.length,
    };
  }
}

// Main Application Class
class AICustomerService {
  constructor() {
    // Initialize configuration first
    window.appConfig = new ConfigManager();
    window.APP_CONFIG = window.appConfig.getConfig();

    // Initialize services
    this.errorHandler = new ErrorHandler();
    this.apiService = new APIService();
    this.performanceMonitor = new PerformanceMonitor();

    this.initializeApp();
  }

  async initializeApp() {
    try {
      // Perform initial health check
      await this.apiService.healthCheck();

      // Initialize the rest of the application
      await this.setupDOM();
      this.initializeEventListeners();
      this.initializeVoiceRecognition();
      this.initializePerformanceMonitoring();

      // Load initial data
      await this.loadInitialData();

      console.log("🚀 AI Customer Service Platform initialized successfully");
    } catch (error) {
      console.error("Failed to initialize application:", error);
      this.errorHandler.logError("App Initialization Failed", {
        error: error.message,
      });
    }
  }

  setupDOM() {
    return new Promise((resolve) => {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => resolve());
      } else {
        resolve();
      }
    });
  }

  async loadInitialData() {
    try {
      const [stats, userPreferences] = await Promise.all([
        this.apiService.getKnowledgeStats(),
        this.loadUserPreferences(),
      ]);

      this.updateStatsDisplay(stats);
      this.applyUserPreferences(userPreferences);
    } catch (error) {
      console.warn("Failed to load initial data:", error);
    }
  }

  loadUserPreferences() {
    return new Promise((resolve) => {
      try {
        const preferences = {
          theme: localStorage.getItem("theme") || "light",
          language: localStorage.getItem("language") || "en",
          autoSave: localStorage.getItem("autoSave") !== "false",
          notifications: localStorage.getItem("notifications") !== "false",
        };
        resolve(preferences);
      } catch (error) {
        console.warn("Failed to load user preferences:", error);
        resolve({
          theme: "light",
          language: "en",
          autoSave: true,
          notifications: true,
        });
      }
    });
  }

  applyUserPreferences(preferences) {
    if (preferences.theme === "dark") {
      this.enableDarkMode();
    }
  }

  // DOM Elements and State Initialization
  async initializeChat() {
    // Initialize user
    this.currentUser = localStorage.getItem("userId") || this.generateUserId();
    localStorage.setItem("userId", this.currentUser);

    // Load chat history from localStorage
    const localHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
    this.chatHistory = localHistory;

    // Load search count
    this.searchCountValue = parseInt(localStorage.getItem("searchCount")) || 0;
    this.updateSearchCount();

    // Load knowledge stats
    await this.loadKnowledgeStats();

    if (localHistory.length > 0) {
      this.welcomeCard.style.display = "none";
      localHistory.forEach((message) => {
        this.addMessageToChat(message.text, message.sender, false);
      });
    }

    // Apply saved theme
    if (localStorage.getItem("darkMode") === "true") {
      this.enableDarkMode();
    }

    // Initialize smooth scrolling
    this.initializeSmoothScrolling();

    // Check connection status
    this.checkConnectionStatus();
  }

  initializeEventListeners() {
    // Core chat functionality
    this.sendButton.addEventListener("click", () => this.sendMessage());
    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Character counter
    this.messageInput.addEventListener("input", () => {
      this.updateCharacterCounter();
      this.autoResizeTextarea();
    });

    // Theme and chat management
    this.clearChatButton.addEventListener("click", () => this.clearChat());
    this.themeToggle.addEventListener("click", () => this.toggleTheme());
    this.copyChat.addEventListener("click", () => this.copyChatToClipboard());

    // Questionnaire
    this.questionnaireToggle.addEventListener("click", () =>
      this.toggleQuestionnaire()
    );

    // Voice functionality
    this.voiceInputBtn.addEventListener("click", () => this.startVoiceInput());
    this.voiceToggle.addEventListener("click", () => this.toggleVoiceInput());
    this.stopVoice.addEventListener("click", () => this.stopVoiceInput());

    // Stats and monitoring
    this.refreshStats.addEventListener("click", () =>
      this.loadKnowledgeStats()
    );

    // File Upload
    this.uploadBtn.addEventListener("click", () => this.openUploadModal());
    this.closeModal.addEventListener("click", () => this.closeUploadModal());
    this.cancelUpload.addEventListener("click", () => this.closeUploadModal());
    this.browseBtn.addEventListener("click", () => this.fileInput.click());
    this.fileInput.addEventListener("change", (e) => this.handleFileSelect(e));
    this.removeFile.addEventListener("click", () => this.removeSelectedFile());
    this.confirmUpload.addEventListener("click", () => this.uploadFile());

    // Question tabs functionality
    const questionTabs = document.querySelectorAll(".question-tab");
    questionTabs.forEach((tab) => {
      tab.addEventListener("click", () => this.handleQuestionTabClick(tab));
    });

    // Quick questions functionality
    const quickQuestions = document.querySelectorAll(".quick-question");
    quickQuestions.forEach((question) => {
      question.addEventListener("click", () =>
        this.handleQuickQuestionClick(question)
      );
    });

    // Online/offline detection
    window.addEventListener("online", () => this.handleConnectionChange(true));
    window.addEventListener("offline", () =>
      this.handleConnectionChange(false)
    );

    // Before unload confirmation
    window.addEventListener("beforeunload", (e) => {
      if (this.chatHistory.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
  }

  initializeVoiceRecognition() {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";

      this.recognition.onstart = () => {
        this.isVoiceActive = true;
        this.voiceIndicator.classList.remove("hidden");
        this.voiceStatus.textContent = "Listening...";
      };

      this.recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");

        this.messageInput.value = transcript;
        this.updateCharacterCounter();
      };

      this.recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        this.voiceStatus.textContent = `Error: ${event.error}`;
        this.stopVoiceInput();
      };

      this.recognition.onend = () => {
        this.stopVoiceInput();
      };
    } else {
      this.voiceInputBtn.style.display = "none";
      this.voiceToggle.style.display = "none";
    }
  }

  initializePerformanceMonitoring() {
    // Monitor response times
    this.performanceMetrics = {
      responseTimes: [],
      averageResponseTime: 0,
    };

    // Update response time display periodically
    setInterval(() => {
      this.updateResponseTimeDisplay();
    }, 5000);
  }

  initializeSmoothScrolling() {
    this.chatContainer.style.scrollBehavior = "smooth";

    // Custom smooth scroll function
    this.chatContainer.scrollTo = function (options) {
      const start = this.scrollTop;
      const change = options.top - start;
      const increment = 20;
      let currentTime = 0;
      const duration = 300;

      const animateScroll = () => {
        currentTime += increment;
        const val = this.easeInOutQuad(currentTime, start, change, duration);
        this.scrollTop = val;
        if (currentTime < duration) {
          setTimeout(animateScroll, increment);
        }
      };
      animateScroll();
    };

    // Easing function
    Math.easeInOutQuad = function (t, b, c, d) {
      t /= d / 2;
      if (t < 1) return (c / 2) * t * t + b;
      t--;
      return (-c / 2) * (t * (t - 2) - 1) + b;
    };
  }

  // Core Chat Methods
  async sendMessage() {
    const message = this.messageInput.value.trim();

    if (message === "") return;

    // Validate message length
    if (!window.appConfig.validateMessage(message)) {
      this.showToast(
        `Message too long. Maximum ${
          window.appConfig.getConfig().CHAT.MAX_MESSAGE_LENGTH
        } characters allowed.`,
        "error"
      );
      return;
    }

    // Increment search count
    this.incrementSearchCount();

    // Add user message to chat
    await this.addMessageToChat(message, "user");

    // Clear input and reset height
    this.messageInput.value = "";
    this.messageInput.style.height = "auto";
    this.charCounter.classList.add("hidden");

    // Hide welcome card after first message
    if (this.welcomeCard.style.display !== "none") {
      this.welcomeCard.style.display = "none";
    }

    // Close questionnaire if open
    this.closeQuestionnaire();

    // Show typing indicator
    this.showTypingIndicator();

    // Measure response time
    const startTime = performance.now();

    try {
      // Get AI response from backend
      const botResponse = await this.apiService.chat(
        message,
        this.chatHistory.slice(-4)
      );
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      this.updatePerformanceMetrics(responseTime);
      this.hideTypingIndicator();
      await this.addMessageToChat(botResponse.response, "bot");
    } catch (error) {
      this.hideTypingIndicator();
      console.error("Error getting AI response:", error);
      const fallbackResponse = this.getFallbackResponse(error);
      await this.addMessageToChat(fallbackResponse, "bot");
    }
  }

  async addMessageToChat(message, sender, saveToHistory = true) {
    const messageElement = document.createElement("div");
    messageElement.classList.add(
      "message",
      "flex",
      "items-end",
      "space-x-2",
      "message-entering"
    );

    if (sender === "user") {
      messageElement.classList.add("justify-end");
      messageElement.innerHTML = `
                <div class="user-message px-4 py-3 max-w-xs md:max-w-md">
                    ${this.escapeHtml(message)}
                </div>
                <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <i class="fas fa-user text-white text-xs"></i>
                </div>
            `;
    } else {
      messageElement.classList.add("justify-start");
      messageElement.innerHTML = `
                <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <i class="fas fa-robot text-white text-xs"></i>
                </div>
                <div class="bot-message px-4 py-3 max-w-xs md:max-w-md">
                    ${this.formatBotResponse(message)}
                </div>
            `;
    }

    this.chatContainer.appendChild(messageElement);

    // Enhanced smooth scrolling with delay for animation
    setTimeout(() => {
      this.scrollToBottom();
    }, 50);

    // Save to chat history
    if (saveToHistory) {
      const messageData = {
        text: message,
        sender: sender,
        timestamp: new Date().toISOString(),
      };

      this.chatHistory.push(messageData);

      // Keep only last 50 messages
      if (
        this.chatHistory.length >
        window.appConfig.getConfig().CHAT.MAX_HISTORY_LENGTH
      ) {
        this.chatHistory = this.chatHistory.slice(
          -window.appConfig.getConfig().CHAT.MAX_HISTORY_LENGTH
        );
      }

      localStorage.setItem("chatHistory", JSON.stringify(this.chatHistory));
    }
  }

  // Voice Methods
  startVoiceInput() {
    if (this.recognition && !this.isVoiceActive) {
      this.voiceModal.classList.remove("hidden");
      this.recognition.start();
    }
  }

  stopVoiceInput() {
    if (this.recognition && this.isVoiceActive) {
      this.recognition.stop();
      this.isVoiceActive = false;
      this.voiceIndicator.classList.add("hidden");
      this.voiceModal.classList.add("hidden");
    }
  }

  toggleVoiceInput() {
    if (this.isVoiceActive) {
      this.stopVoiceInput();
    } else {
      this.startVoiceInput();
    }
  }

  // Utility Methods
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  formatBotResponse(text) {
    // Simple formatting for bot responses
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
  }

  generateUserId() {
    return "user-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
  }

  updateCharacterCounter() {
    const length = this.messageInput.value.length;
    this.charCount.textContent = length;

    if (length > 0) {
      this.charCounter.classList.remove("hidden");

      if (length > 800) {
        this.charCounter.classList.add("text-orange-500");
        this.charCounter.classList.remove("text-slate-400");
      } else {
        this.charCounter.classList.remove("text-orange-500");
        this.charCounter.classList.add("text-slate-400");
      }
    } else {
      this.charCounter.classList.add("hidden");
    }
  }

  autoResizeTextarea() {
    this.messageInput.style.height = "auto";
    this.messageInput.style.height = this.messageInput.scrollHeight + "px";
  }

  scrollToBottom() {
    if (this.chatContainer) {
      const scrollHeight = this.chatContainer.scrollHeight;
      const currentScroll = this.chatContainer.scrollTop;
      const clientHeight = this.chatContainer.clientHeight;

      if (scrollHeight - currentScroll - clientHeight > 100) {
        this.chatContainer.scrollTo({
          top: scrollHeight,
          behavior: "smooth",
        });
      } else {
        this.chatContainer.scrollTop = scrollHeight;
      }
    }
  }

  // Performance Monitoring
  updatePerformanceMetrics(responseTime) {
    this.performanceMetrics.responseTimes.push(responseTime);

    // Keep only last 10 response times
    if (this.performanceMetrics.responseTimes.length > 10) {
      this.performanceMetrics.responseTimes.shift();
    }

    // Calculate average
    this.performanceMetrics.averageResponseTime =
      this.performanceMetrics.responseTimes.reduce((a, b) => a + b, 0) /
      this.performanceMetrics.responseTimes.length;
  }

  updateResponseTimeDisplay() {
    const avgTime = this.performanceMetrics.averageResponseTime;
    if (avgTime > 0) {
      this.responseTime.textContent = `~${Math.round(avgTime)}ms`;
    }
  }

  // Search Count Management
  incrementSearchCount() {
    this.searchCountValue++;
    this.updateSearchCount();
    localStorage.setItem("searchCount", this.searchCountValue.toString());
  }

  updateSearchCount() {
    this.searchCount.textContent = this.searchCountValue;
  }

  // Connection Management
  async checkConnectionStatus() {
    try {
      const response = await this.apiService.healthCheck();
      this.isOnline = true;
      this.updateConnectionStatus();
    } catch (error) {
      this.isOnline = false;
      this.updateConnectionStatus();
    }
  }

  handleConnectionChange(online) {
    this.isOnline = online;
    this.updateConnectionStatus();

    if (online) {
      this.showToast("Connection restored", "success");
    } else {
      this.showToast("Connection lost - working offline", "warning");
    }
  }

  updateConnectionStatus() {
    if (this.isOnline) {
      this.connectionStatus.textContent = "Connected";
      this.connectionStatus.className = "connection-connected";
    } else {
      this.connectionStatus.textContent = "Offline";
      this.connectionStatus.className = "connection-error";
    }
  }

  // Toast Notifications
  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white shadow-lg transform translate-x-full transition-transform duration-300 z-50 ${
      type === "success"
        ? "bg-green-500"
        : type === "warning"
        ? "bg-orange-500"
        : type === "error"
        ? "bg-red-500"
        : "bg-blue-500"
    }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove("translate-x-full");
    }, 100);

    setTimeout(() => {
      toast.classList.add("translate-x-full");
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // Copy Chat Functionality
  async copyChatToClipboard() {
    const chatText = this.chatHistory
      .map((msg) => `${msg.sender === "user" ? "You" : "AI"}: ${msg.text}`)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(chatText);
      this.copyChat.classList.add("copied");
      this.copyChat.innerHTML = '<i class="fas fa-check text-sm"></i>';

      setTimeout(() => {
        this.copyChat.classList.remove("copied");
        this.copyChat.innerHTML = '<i class="fas fa-copy text-sm"></i>';
      }, 2000);

      this.showToast("Chat copied to clipboard", "success");
    } catch (error) {
      this.showToast("Failed to copy chat", "error");
    }
  }

  // Error Handling
  getFallbackResponse(error) {
    if (!this.isOnline) {
      return "I'm currently offline. Please check your internet connection and try again.";
    }

    if (error.message.includes("timeout")) {
      return "The request timed out. Please try again in a moment.";
    }

    if (error.message.includes("500")) {
      return "The server is experiencing issues. Please try again later.";
    }

    return "I'm having trouble connecting right now. Please try again in a moment.";
  }

  // API Integration
  async loadKnowledgeStats() {
    try {
      const stats = await this.apiService.getKnowledgeStats();
      this.updateStatsDisplay(stats);
      this.showToast("Stats updated", "success");
    } catch (error) {
      console.error("Error loading knowledge stats:", error);
      this.showToast("Failed to load stats", "error");
    }
  }

  updateStatsDisplay(stats) {
    this.totalChunks.textContent = stats.total_chunks;
    this.baseChunks.textContent = stats.base_knowledge_chunks;
    this.uploadedDocs.textContent = stats.uploaded_documents;
    this.totalDocs.textContent = stats.total_chunks;
  }

  // Question handlers
  handleQuestionTabClick(tab) {
    tab.style.transform = "scale(0.95)";
    setTimeout(() => {
      tab.style.transform = "";
    }, 150);

    if (tab.id === "uploadDocBtn") {
      this.openUploadModal();
    } else {
      const question = tab.getAttribute("data-question");
      this.messageInput.value = question;
      this.sendMessage();

      if (this.welcomeCard) {
        this.welcomeCard.style.display = "none";
      }
    }
  }

  handleQuickQuestionClick(question) {
    const questionText = question.getAttribute("data-question");
    this.messageInput.value = questionText;
    this.sendMessage();
    this.closeQuestionnaire();
  }

  // Questionnaire methods
  toggleQuestionnaire() {
    if (this.isQuestionnaireOpen) {
      this.closeQuestionnaire();
    } else {
      this.openQuestionnaire();
    }
  }

  openQuestionnaire() {
    this.questionnaireOptions.classList.remove("hidden");
    this.questionnaireOptions.style.maxHeight =
      this.questionnaireOptions.scrollHeight + "px";
    this.toggleIcon.classList.add("rotate-180");
    this.isQuestionnaireOpen = true;
  }

  closeQuestionnaire() {
    this.questionnaireOptions.classList.add("hidden");
    this.questionnaireOptions.style.maxHeight = "0";
    this.toggleIcon.classList.remove("rotate-180");
    this.isQuestionnaireOpen = false;
  }

  // Typing indicator
  showTypingIndicator() {
    this.typingIndicator.classList.remove("hidden");
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.typingIndicator.classList.add("hidden");
  }

  // Theme management
  toggleTheme() {
    if (this.isDarkMode) {
      this.disableDarkMode();
    } else {
      this.enableDarkMode();
    }
  }

  enableDarkMode() {
    document.body.classList.add("dark-mode");
    this.themeToggle.innerHTML = '<i class="fas fa-sun text-yellow-400"></i>';
    this.isDarkMode = true;
    localStorage.setItem("darkMode", "true");
  }

  disableDarkMode() {
    document.body.classList.remove("dark-mode");
    this.themeToggle.innerHTML = '<i class="fas fa-moon text-slate-600"></i>';
    this.isDarkMode = false;
    localStorage.setItem("darkMode", "false");
  }

  // File upload methods
  openUploadModal() {
    this.uploadModal.classList.remove("hidden");
    this.resetUploadForm();
  }

  closeUploadModal() {
    this.uploadModal.classList.add("hidden");
    this.resetUploadForm();
  }

  resetUploadForm() {
    this.selectedFile = null;
    this.fileInput.value = "";
    this.fileInfo.classList.add("hidden");
    this.confirmUpload.disabled = true;
    this.uploadProgress.classList.add("hidden");
    this.uploadResult.classList.add("hidden");
    this.progressBar.style.width = "0%";
    this.progressPercent.textContent = "0%";
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      // Use config validation
      const validation = window.appConfig.validateFile(file);
      if (!validation.isValid) {
        validation.errors.forEach((error) => this.showToast(error, "error"));
        return;
      }

      this.selectedFile = file;
      this.updateFileInfo(file);
    }
  }

  updateFileInfo(file) {
    this.fileName.textContent = file.name;
    this.fileSize.textContent = this.formatFileSize(file.size);
    this.fileInfo.classList.remove("hidden");
    this.confirmUpload.disabled = false;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  removeSelectedFile() {
    this.selectedFile = null;
    this.fileInput.value = "";
    this.fileInfo.classList.add("hidden");
    this.confirmUpload.disabled = true;
  }

  async uploadFile() {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append("file", this.selectedFile);

    this.uploadProgress.classList.remove("hidden");
    this.confirmUpload.disabled = true;

    try {
      const result = await this.apiService.uploadFile(formData);
      this.showUploadResult(`✅ ${result.message}`, "success");
      await this.loadKnowledgeStats();

      setTimeout(() => {
        this.closeUploadModal();
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      this.showUploadResult("❌ Upload failed. Please try again.", "error");
      this.confirmUpload.disabled = false;
    }
  }

  simulateUploadProgress() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 90) {
        clearInterval(interval);
      } else {
        this.progressBar.style.width = progress + "%";
        this.progressPercent.textContent = Math.round(progress) + "%";
      }
    }, 200);
  }

  showUploadResult(message, type) {
    this.uploadResult.textContent = message;
    this.uploadResult.className = "mt-4 p-3 rounded-lg ";

    if (type === "success") {
      this.uploadResult.classList.add(
        "bg-green-100",
        "text-green-800",
        "border",
        "border-green-200"
      );
    } else {
      this.uploadResult.classList.add(
        "bg-red-100",
        "text-red-800",
        "border",
        "border-red-200"
      );
    }

    this.uploadResult.classList.remove("hidden");
  }

  // Clear chat with enhanced animation
  async clearChat() {
    if (
      confirm(
        "Are you sure you want to clear the chat history? This cannot be undone."
      )
    ) {
      this.chatContainer.style.opacity = "0.5";
      this.chatContainer.style.transform = "scale(0.98)";

      setTimeout(() => {
        this.chatContainer.innerHTML = "";
        this.chatHistory = [];
        localStorage.removeItem("chatHistory");
        this.welcomeCard.style.display = "block";

        this.chatContainer.style.opacity = "1";
        this.chatContainer.style.transform = "scale(1)";

        this.addMessageToChat(
          "Hello! I'm your AI customer service assistant. How can I help you today?",
          "bot",
          false
        );
      }, 300);
    }
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  window.aiCustomerService = new AICustomerService();
});
