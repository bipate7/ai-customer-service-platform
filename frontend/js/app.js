// app.js - Enhanced Main Application Logic for AI Customer Service Platform - PHASE 7

class ChatApp {
  constructor() {
    this.isDarkMode = false;
    this.chatHistory = [];
    this.apiService = new APIService();
    this.realTimeTyping = new RealTimeTyping();
    this.userSession = this.initializeUserSession();

    // PHASE 7: Initialize Security Services
    this.securityService = window.securityService || null;
    this.performanceMonitor = window.performanceMonitor || null;
    this.init();
  }

  initializeUserSession() {
    return {
      sessionId: this.generateSessionId(),
      startTime: new Date().toISOString(),
      messageCount: 0,
      preferredModel: "AUTO",
      interactionStyle: "balanced",
    };
  }

  generateSessionId() {
    return (
      "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  init() {
    this.setupEventListeners();
    this.setupQuickQuestions();
    this.setupMessageInput();
    this.setupFileUpload();
    this.setupVoiceInput();
    this.setupModelSelector();
    this.setupSecurityFeatures(); // NEW: Security setup
    this.loadSessionData();

    // Initialize analytics
    this.trackSessionStart();

    // PHASE 7: Security audit on init
    this.performSecurityAudit();
  }

  // PHASE 7: Security Features Setup
  setupSecurityFeatures() {
    // Security button in header
    const securityBtn = document.getElementById("securityBtn");
    if (securityBtn) {
      securityBtn.addEventListener("click", () => {
        this.showSecurityModal();
      });
    }

    // Close security modal
    const closeSecurityModal = document.getElementById("closeSecurityModal");
    if (closeSecurityModal) {
      closeSecurityModal.addEventListener("click", () => {
        this.hideSecurityModal();
      });
    }

    // Initialize security monitoring
    this.initializeSecurityMonitoring();
  }

  initializeSecurityMonitoring() {
    if (this.securityService) {
      // Set up session security
      this.securityService.setupSessionSecurity();

      // Set up API rate limiting
      this.apiRateLimiter = this.securityService.setupAPIRateLimiting();
    }
  }

  // PHASE 7: Security Validation Methods
  validateMessageSecurity(message) {
    if (!this.securityService) return true;

    // Check message length
    if (!this.securityService.validateMessage(message)) {
      this.showNotification(
        "Message too long. Please shorten your message.",
        "warning"
      );
      return false;
    }

    // Check for suspicious content
    const sanitized = this.securityService.sanitizeInput(message);
    if (sanitized !== message) {
      console.warn("Input sanitization applied to message");
    }

    return true;
  }

  checkRateLimit(endpoint) {
    if (!this.apiRateLimiter) return true;
    return this.apiRateLimiter.canMakeRequest(endpoint);
  }

  // PHASE 7: Security Modal
  showSecurityModal() {
    const securityModal = document.getElementById("securityModal");
    if (securityModal) {
      securityModal.classList.remove("hidden");
    }
  }

  hideSecurityModal() {
    const securityModal = document.getElementById("securityModal");
    if (securityModal) {
      securityModal.classList.add("hidden");
    }
  }

  // PHASE 7: Security Audit
  performSecurityAudit() {
    if (this.securityService) {
      const audit = this.securityService.performSecurityAudit();

      if (window.APP_CONFIG?.ENVIRONMENT === "development") {
        console.log("Security Audit Results:", audit);
      }

      // Log any security issues
      if (audit.issues.length > 0) {
        console.warn("Security issues detected:", audit.issues);
      }

      if (audit.warnings.length > 0) {
        console.warn("Security warnings:", audit.warnings);
      }

      this.trackInteraction("security_audit", audit);
    }
  }

  // PHASE 7: Data Anonymization for Privacy
  anonymizeAnalyticsData(data) {
    const anonymized = { ...data };

    // Remove or hash potentially identifiable information
    if (anonymized.sessionId) {
      anonymized.sessionId = this.hashData(anonymized.sessionId);
    }

    // Remove user-specific data
    delete anonymized.userAgent;
    delete anonymized.url;

    return anonymized;
  }

  hashData(data) {
    // Simple hash function for anonymization
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return "user_" + Math.abs(hash).toString(36);
  }

  // PHASE 7: Enhanced Session Management with Security
  validateSessionData(sessionData) {
    // Basic validation of session data structure
    if (!sessionData || typeof sessionData !== "object") return false;
    if (!sessionData.sessionId || typeof sessionData.sessionId !== "string")
      return false;
    if (
      !sessionData.startTime ||
      isNaN(new Date(sessionData.startTime).getTime())
    )
      return false;

    return true;
  }

  setupEventListeners() {
    // Theme toggle
    document.getElementById("themeToggle").addEventListener("click", () => {
      this.toggleTheme();
    });

    // Clear chat
    document.getElementById("clearChat").addEventListener("click", () => {
      this.clearChat();
    });

    // Settings button
    document.getElementById("settingsBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleModelSelector();
    });

    // Copy chat
    document.getElementById("copyChat").addEventListener("click", () => {
      this.copyChat();
    });

    // Refresh stats
    document.getElementById("refreshStats").addEventListener("click", () => {
      this.refreshStats();
    });

    // Close model selector when clicking outside
    document.addEventListener("click", () => {
      this.hideModelSelector();
    });
  }

  // PHASE 7: Model Selector Setup
  setupModelSelector() {
    const modelSelector = document.createElement("div");
    modelSelector.id = "modelSelector";
    modelSelector.className = "model-selector hidden";
    modelSelector.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-4 border border-slate-200 w-64">
        <h4 class="font-semibold text-slate-800 mb-3">AI Model Selection</h4>
        <div class="space-y-2">
          <button class="model-option w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors border-2 border-transparent" data-model="AUTO">
            <div class="flex justify-between items-center">
              <span class="flex items-center gap-2">
                <i class="fas fa-robot text-blue-500"></i>
                Auto Select
              </span>
              <i class="fas fa-check text-blue-500"></i>
            </div>
            <div class="text-xs text-slate-500 mt-1">Smart model selection based on query</div>
          </button>
          <button class="model-option w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors border-2 border-transparent" data-model="PRIMARY">
            <div class="flex justify-between items-center">
              <span class="flex items-center gap-2">
                <i class="fas fa-brain text-purple-500"></i>
                GPT-4
              </span>
              <i class="fas fa-check text-blue-500 hidden"></i>
            </div>
            <div class="text-xs text-slate-500 mt-1">Most capable, detailed responses</div>
          </button>
          <button class="model-option w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors border-2 border-transparent" data-model="FAST">
            <div class="flex justify-between items-center">
              <span class="flex items-center gap-2">
                <i class="fas fa-bolt text-green-500"></i>
                GPT-3.5 Turbo
              </span>
              <i class="fas fa-check text-blue-500 hidden"></i>
            </div>
            <div class="text-xs text-slate-500 mt-1">Fast responses, efficient</div>
          </button>
          <button class="model-option w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors border-2 border-transparent" data-model="CODE" id="codeModelOption">
            <div class="flex justify-between items-center">
              <span class="flex items-center gap-2">
                <i class="fas fa-code text-orange-500"></i>
                Claude Instant
              </span>
              <i class="fas fa-check text-blue-500 hidden"></i>
            </div>
            <div class="text-xs text-slate-500 mt-1">Best for code & technical</div>
          </button>
        </div>
        <div class="mt-3 pt-3 border-t border-slate-200">
          <div class="text-xs text-slate-500">
            Current: <span id="currentModelDisplay">Auto Select</span>
          </div>
        </div>
      </div>
    `;

    // Add model selector to the settings area
    const settingsBtn = document.getElementById("settingsBtn");
    settingsBtn.parentNode.appendChild(modelSelector);

    // Model selection
    modelSelector.querySelectorAll(".model-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        const model = option.dataset.model;
        this.selectModel(model);
      });
    });

    // Update model availability based on feature flags
    this.updateModelAvailability();
  }

  toggleModelSelector() {
    const modelSelector = document.getElementById("modelSelector");
    if (modelSelector) {
      modelSelector.classList.toggle("hidden");
    }
  }

  hideModelSelector() {
    const modelSelector = document.getElementById("modelSelector");
    if (modelSelector) {
      modelSelector.classList.add("hidden");
    }
  }

  selectModel(model) {
    this.userSession.preferredModel = model;

    // Update UI
    document.querySelectorAll(".model-option").forEach((opt) => {
      const check = opt.querySelector(".fa-check");
      if (opt.dataset.model === model) {
        check.classList.remove("hidden");
        opt.classList.add("bg-blue-50", "border-blue-200");
      } else {
        check.classList.add("hidden");
        opt.classList.remove("bg-blue-50", "border-blue-200");
      }
    });

    // Update current model display
    const currentModelDisplay = document.getElementById("currentModelDisplay");
    if (currentModelDisplay) {
      currentModelDisplay.textContent = this.getModelDisplayName(model);
    }

    this.showNotification(
      `AI Model set to: ${this.getModelDisplayName(model)}`,
      "success"
    );
    this.saveSessionData();
    this.hideModelSelector();
  }

  getModelDisplayName(model) {
    const names = {
      AUTO: "Auto Select",
      PRIMARY: "GPT-4",
      FAST: "GPT-3.5 Turbo",
      CODE: "Claude Instant",
    };
    return names[model] || model;
  }

  updateModelAvailability() {
    // Disable code model if not available
    const codeModelOption = document.getElementById("codeModelOption");
    if (codeModelOption && !this.apiService.isModelAvailable("CODE")) {
      codeModelOption.disabled = true;
      codeModelOption.classList.add("opacity-50", "cursor-not-allowed");
      codeModelOption.title = "Code model not available in current environment";
    }
  }

  setupQuickQuestions() {
    const questionnaireToggle = document.getElementById("questionnaireToggle");
    const questionnaireOptions = document.getElementById(
      "questionnaireOptions"
    );
    const toggleIcon = document.getElementById("toggleIcon");

    questionnaireToggle.addEventListener("click", () => {
      questionnaireOptions.classList.toggle("hidden");
      toggleIcon.classList.toggle("fa-chevron-down");
      toggleIcon.classList.toggle("fa-chevron-up");
    });

    // Handle quick question clicks
    const quickQuestions = document.querySelectorAll(".quick-question");
    const messageInput = document.getElementById("messageInput");

    quickQuestions.forEach((button) => {
      button.addEventListener("click", () => {
        const question = button.getAttribute("data-question");
        messageInput.value = question;
        messageInput.focus();
      });
    });

    // Handle question tab clicks
    const questionTabs = document.querySelectorAll(".question-tab");

    questionTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        if (tab.id === "uploadDocBtn") {
          document.getElementById("uploadBtn").click();
        } else {
          const question = tab.getAttribute("data-question");
          messageInput.value = question;
          messageInput.focus();
        }
      });
    });
  }

  setupMessageInput() {
    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const charCounter = document.getElementById("charCounter");
    const charCount = document.getElementById("charCount");

    // Auto-resize textarea
    messageInput.addEventListener("input", () => {
      messageInput.style.height = "auto";
      messageInput.style.height = messageInput.scrollHeight + "px";

      // Show character counter when typing
      const length = messageInput.value.length;
      if (length > 0) {
        charCounter.classList.remove("hidden");
        charCount.textContent = length;

        // Change color when approaching limit
        if (length > 800) {
          charCounter.classList.add("text-orange-500");
          charCounter.classList.remove("text-slate-400");
        } else {
          charCounter.classList.remove("text-orange-500");
          charCounter.classList.add("text-slate-400");
        }
      } else {
        charCounter.classList.add("hidden");
      }
    });

    // Send message on Enter (but allow Shift+Enter for new line)
    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Send button functionality
    sendButton.addEventListener("click", () => {
      this.sendMessage();
    });
  }

  setupFileUpload() {
    const uploadBtn = document.getElementById("uploadBtn");
    const closeModal = document.getElementById("closeModal");
    const cancelUpload = document.getElementById("cancelUpload");
    const browseBtn = document.getElementById("browseBtn");
    const fileInput = document.getElementById("fileInput");
    const confirmUpload = document.getElementById("confirmUpload");
    const removeFile = document.getElementById("removeFile");
    const uploadModal = document.getElementById("uploadModal");

    uploadBtn.addEventListener("click", () => {
      uploadModal.classList.remove("hidden");
    });

    closeModal.addEventListener("click", () => {
      uploadModal.classList.add("hidden");
    });

    cancelUpload.addEventListener("click", () => {
      uploadModal.classList.add("hidden");
    });

    browseBtn.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
      this.handleFileSelect(e);
    });

    removeFile.addEventListener("click", () => {
      this.clearFileSelection();
    });

    confirmUpload.addEventListener("click", () => {
      this.uploadFile();
    });
  }

  setupVoiceInput() {
    const voiceInputBtn = document.getElementById("voiceInputBtn");
    const voiceModal = document.getElementById("voiceModal");
    const stopVoice = document.getElementById("stopVoice");
    const voiceToggle = document.getElementById("voiceToggle");

    voiceInputBtn.addEventListener("click", () => {
      voiceModal.classList.remove("hidden");
      this.startVoiceInput();
    });

    stopVoice.addEventListener("click", () => {
      voiceModal.classList.add("hidden");
      this.stopVoiceInput();
    });

    voiceToggle.addEventListener("click", () => {
      if (voiceModal.classList.contains("hidden")) {
        voiceModal.classList.remove("hidden");
        this.startVoiceInput();
      } else {
        voiceModal.classList.add("hidden");
        this.stopVoiceInput();
      }
    });
  }

  // PHASE 7: Enhanced Send Message with Security
  async sendMessage() {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();

    if (!message) return;

    // PHASE 7: Security validation
    if (!this.validateMessageSecurity(message)) {
      return;
    }

    // PHASE 7: Rate limiting check
    if (!this.checkRateLimit("chat")) {
      this.showNotification(
        "Please wait a moment before sending another message.",
        "warning"
      );
      return;
    }

    // Add user message to chat
    this.addMessageToChat(message, "user");
    messageInput.value = "";
    messageInput.style.height = "auto";

    // Update session
    this.userSession.messageCount++;

    // Hide character counter
    document.getElementById("charCounter").classList.add("hidden");

    try {
      // PHASE 7: Show appropriate typing indicator
      const typingType = this.detectTypingType(message);
      this.realTimeTyping.showTypingIndicator(typingType);

      // PHASE 7: Security - Sanitize input before sending
      const sanitizedMessage = this.securityService
        ? this.securityService.sanitizeInput(message)
        : message;

      // PHASE 7: Analyze sentiment
      const sentiment = await this.apiService.analyzeSentiment(
        sanitizedMessage
      );

      // PHASE 7: Get conversation context
      const context = this.apiService.getConversationContext();

      // PHASE 7: Enhanced chat with multi-model support
      const response = await this.apiService.chat(sanitizedMessage, context, {
        modelType: this.userSession.preferredModel,
      });

      this.realTimeTyping.hideTypingIndicator();

      // PHASE 7: Add AI response with streaming effect
      await this.addStreamingResponse(
        response.response,
        sentiment,
        response.modelUsed
      );

      // PHASE 7: Track successful interaction with security
      this.trackInteraction("message_sent", {
        model: response.modelUsed,
        sentiment: sentiment?.label,
        length: message.length,
        security_checked: true,
      });
    } catch (error) {
      this.realTimeTyping.hideTypingIndicator();

      // PHASE 7: Enhanced error handling with security context
      this.handleError("Failed to get response. Please try again.", error);

      // PHASE 7: Track error with security context
      this.trackInteraction("message_error", {
        error: error.message,
        security_checked: true,
      });
    }

    this.saveSessionData();
  }

  // PHASE 7: Detect typing indicator type based on message
  detectTypingType(message) {
    if (message.length > 100) return "analyzing";
    if (this.containsQuestion(message)) return "thinking";
    if (this.containsTechnicalTerms(message)) return "searching";
    if (this.containsComplexTerms(message)) return "processing";
    return "writing";
  }

  containsQuestion(text) {
    return /^(what|how|why|when|where|who|can|could|would|will|is|are|do|does)/i.test(
      text.trim()
    );
  }

  containsTechnicalTerms(text) {
    const technicalTerms = [
      "error",
      "bug",
      "code",
      "api",
      "technical",
      "documentation",
      "guide",
      "programming",
    ];
    return technicalTerms.some((term) => text.toLowerCase().includes(term));
  }

  containsComplexTerms(text) {
    const complexTerms = [
      "analyze",
      "compare",
      "evaluate",
      "explain",
      "describe",
      "discuss",
    ];
    return complexTerms.some((term) => text.toLowerCase().includes(term));
  }

  // PHASE 7: Enhanced message addition with streaming
  async addStreamingResponse(message, sentiment, modelUsed) {
    const chatContainer = document.getElementById("chatContainer");

    const messageDiv = document.createElement("div");
    messageDiv.className = `message bot-message flex justify-start`;

    const messageBubble = document.createElement("div");
    messageBubble.className = `max-w-[80%] p-4 bg-slate-100 text-slate-800 rounded-2xl rounded-bl-md streaming-response`;

    // PHASE 7: Add model indicator
    const modelIndicator = document.createElement("div");
    modelIndicator.className =
      "text-xs text-slate-500 mb-2 flex items-center gap-1";
    modelIndicator.innerHTML = `<i class="fas fa-robot"></i> ${this.getModelDisplayName(
      modelUsed
    )}`;
    messageBubble.appendChild(modelIndicator);

    // PHASE 7: Add sentiment-based styling
    if (sentiment && sentiment.label === "positive") {
      messageBubble.classList.add("positive-sentiment");
    } else if (sentiment && sentiment.label === "negative") {
      messageBubble.classList.add("negative-sentiment");
    }

    const contentDiv = document.createElement("div");
    messageBubble.appendChild(contentDiv);
    messageDiv.appendChild(messageBubble);
    chatContainer.appendChild(messageDiv);

    // PHASE 7: Stream the response
    await this.realTimeTyping.streamResponse(
      message,
      (chunk) => {
        contentDiv.textContent = chunk;
        chatContainer.scrollTop = chatContainer.scrollHeight;
      },
      () => {
        // Response complete
        messageBubble.classList.remove("streaming-response");
        this.addMessageToHistory(message, "bot", sentiment, modelUsed);
      }
    );

    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // PHASE 7: Enhanced message history
  addMessageToHistory(message, sender, sentiment = null, modelUsed = null) {
    this.chatHistory.push({
      sender,
      message,
      timestamp: new Date().toISOString(),
      sentiment: sentiment?.label,
      modelUsed: modelUsed,
      confidence: sentiment?.confidence,
    });
  }

  addMessageToChat(message, sender) {
    const chatContainer = document.getElementById("chatContainer");
    const welcomeCard = document.getElementById("welcomeCard");

    // Hide welcome card after first message
    if (welcomeCard && sender === "user") {
      welcomeCard.style.display = "none";
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message flex ${
      sender === "user" ? "justify-end" : "justify-start"
    }`;

    const messageBubble = document.createElement("div");
    messageBubble.className = `max-w-[80%] p-4 rounded-2xl ${
      sender === "user"
        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-md"
        : "bg-slate-100 text-slate-800 rounded-bl-md"
    }`;

    messageBubble.textContent = message;
    messageDiv.appendChild(messageBubble);
    chatContainer.appendChild(messageDiv);

    // Add to chat history
    this.chatHistory.push({
      sender,
      message,
      timestamp: new Date().toISOString(),
    });

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // PHASE 7: Enhanced error handling with Security
  handleError(message, error) {
    console.error("Chat Error:", error);

    // PHASE 7: Track error with performance monitoring
    if (this.performanceMonitor) {
      this.performanceMonitor.trackError(error, {
        context: "chat_operation",
        sessionId: this.userSession.sessionId,
      });
    }

    // Show user-friendly error
    this.showNotification(message, "error");

    // Add error message to chat
    this.addMessageToChat(
      "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
      "bot"
    );

    // PHASE 7: Enhanced fallback strategy
    if (this.userSession.preferredModel === "PRIMARY") {
      this.userSession.preferredModel = "FAST";
      this.showNotification(
        "Switched to faster model for better reliability",
        "info"
      );
      this.selectModel("FAST");

      // Track model fallback
      this.trackInteraction("model_fallback", {
        from: "PRIMARY",
        to: "FAST",
        reason: "error_recovery",
      });
    }
  }

  // PHASE 7: Notification system
  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300 ${
      type === "success"
        ? "bg-green-500 text-white"
        : type === "error"
        ? "bg-red-500 text-white"
        : "bg-blue-500 text-white"
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.remove("translate-x-full");
    }, 100);

    // Auto remove
    setTimeout(() => {
      notification.classList.add("translate-x-full");
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // PHASE 7: Enhanced Analytics with Security Context
  trackSessionStart() {
    this.trackInteraction("session_start", {
      sessionId: this.userSession.sessionId,
      preferredModel: this.userSession.preferredModel,
    });
  }

  trackInteraction(event, properties = {}) {
    if (!window.APP_CONFIG?.FEATURES?.ANALYTICS) return;

    const interactionData = {
      event,
      sessionId: this.userSession.sessionId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      environment: window.APP_CONFIG.ENVIRONMENT,
      ...properties,
    };

    // PHASE 7: Performance monitoring integration
    if (this.performanceMonitor) {
      this.performanceMonitor.trackInteraction({
        type: event,
        timestamp: interactionData.timestamp,
        data: properties,
      });
    }

    // In a real app, send to analytics service
    if (window.APP_CONFIG.ENVIRONMENT === "development") {
      console.log("Analytics Event:", interactionData);
    }

    // Store locally for debugging (with security consideration)
    try {
      const analyticsLog = JSON.parse(
        localStorage.getItem("ai_chat_analytics") || "[]"
      );

      // PHASE 7: Anonymize sensitive data before storage
      const anonymizedData = this.anonymizeAnalyticsData(interactionData);
      analyticsLog.push(anonymizedData);

      localStorage.setItem(
        "ai_chat_analytics",
        JSON.stringify(analyticsLog.slice(-100)) // Keep only last 100 entries
      );
    } catch (error) {
      console.warn("Analytics storage failed:", error);
    }
  }

  // PHASE 7: Session management
  loadSessionData() {
    try {
      const saved = localStorage.getItem("ai_chat_session");
      if (saved) {
        const sessionData = JSON.parse(saved);

        // PHASE 7: Validate session data
        if (this.validateSessionData(sessionData)) {
          this.userSession = { ...this.userSession, ...sessionData };

          // Restore selected model
          if (sessionData.preferredModel) {
            this.selectModel(sessionData.preferredModel);
          }
        } else {
          console.warn("Invalid session data detected, using fresh session");
        }
      }
    } catch (error) {
      console.warn("Failed to load session data:", error);
      // PHASE 7: Track security issue
      this.trackInteraction("session_load_failed", { error: error.message });
    }
  }

  saveSessionData() {
    try {
      localStorage.setItem("ai_chat_session", JSON.stringify(this.userSession));
    } catch (error) {
      console.warn("Failed to save session data:", error);
    }
  }

  // Existing methods (updated for Phase 7 compatibility)
  showTypingIndicator() {
    this.realTimeTyping.showTypingIndicator("thinking");
  }

  hideTypingIndicator() {
    this.realTimeTyping.hideTypingIndicator();
  }

  generateAIResponse(question) {
    // Fallback response generator if API fails
    const responses = {
      "What are your business hours?":
        "Our business hours are Monday to Friday, 9 AM to 6 PM EST. We're also available on Saturdays from 10 AM to 2 PM for urgent matters.",
      "Do you offer technical support?":
        "Yes, we offer 24/7 technical support for all our premium customers. Basic support is available during business hours.",
      "What services do you provide?":
        "We provide a range of services including AI-powered customer support, document analysis, automated response systems, and custom AI solutions tailored to your business needs.",
      "How can I contact customer service?":
        "You can contact our customer service team via email at support@example.com, through our live chat, or by calling 1-800-123-4567 during business hours.",
      "What is your refund policy?":
        "We offer a 30-day money-back guarantee for all our subscription plans. If you're not satisfied, you can request a full refund within 30 days of purchase.",
      "What's your pricing?":
        "We offer three pricing tiers: Basic ($29/month), Pro ($79/month), and Enterprise ($199/month). All plans include our core AI features with varying levels of support and customization.",
      "Do you have a free trial?":
        "Yes, we offer a 14-day free trial for our Pro plan. No credit card required to get started!",
      "How do I reset my password?":
        "You can reset your password by clicking on 'Forgot Password' on the login page. We'll send a reset link to your registered email address.",
      "Where can I find documentation?":
        "Our comprehensive documentation is available at docs.example.com. You'll find API references, setup guides, and troubleshooting information there.",
      "What payment methods do you accept?":
        "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual plans.",
      "Do you offer training?":
        "Yes, we offer comprehensive training sessions for new customers. We have both self-paced online courses and live training sessions with our experts.",
      "How do I cancel my subscription?":
        "You can cancel your subscription at any time from your account settings. There are no cancellation fees, and you'll have access until the end of your billing period.",
      "Can I export my data?":
        "Yes, you can export all your data in CSV or JSON format from the data management section in your account settings.",
    };

    return (
      responses[question] ||
      "I understand you're asking about: " +
        question +
        ". Our team is constantly updating our knowledge base. For the most accurate and up-to-date information on this topic, I recommend contacting our support team directly."
    );
  }

  // PHASE 7: Enhanced File Upload with Security
  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // PHASE 7: Enhanced security validation
    const validation = this.securityService
      ? this.securityService.validateFile(file)
      : this.apiService.config?.validateFile?.(file) || {
          isValid:
            file.size <=
            (window.APP_CONFIG?.SECURITY?.MAX_FILE_SIZE || 10 * 1024 * 1024),
          errors: [],
        };

    if (!validation.isValid) {
      this.showUploadResult(
        validation.errors[0] || "File validation failed for security reasons",
        "error"
      );

      // PHASE 7: Track security violation
      this.trackInteraction("file_validation_failed", {
        filename: file.name,
        size: file.size,
        errors: validation.errors,
      });
      return;
    }

    // Show file info
    const fileInfo = document.getElementById("fileInfo");
    const fileName = document.getElementById("fileName");
    const fileSize = document.getElementById("fileSize");
    const confirmUpload = document.getElementById("confirmUpload");

    fileName.textContent = file.name;
    fileSize.textContent = this.formatFileSize(file.size);
    fileInfo.classList.remove("hidden");
    confirmUpload.disabled = false;

    // PHASE 7: Track file selection
    this.trackInteraction("file_selected", {
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  }

  clearFileSelection() {
    const fileInput = document.getElementById("fileInput");
    const fileInfo = document.getElementById("fileInfo");
    const confirmUpload = document.getElementById("confirmUpload");

    fileInput.value = "";
    fileInfo.classList.add("hidden");
    confirmUpload.disabled = true;
  }

  uploadFile() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if (!file) return;

    const uploadProgress = document.getElementById("uploadProgress");
    const progressBar = document.getElementById("progressBar");
    const progressPercent = document.getElementById("progressPercent");
    const confirmUpload = document.getElementById("confirmUpload");

    // Show progress
    uploadProgress.classList.remove("hidden");
    confirmUpload.disabled = true;

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        // Upload complete
        setTimeout(() => {
          this.showUploadResult(
            "File uploaded successfully! The AI assistant can now use this document to answer your questions.",
            "success"
          );
          this.updateStats();
          setTimeout(() => {
            document.getElementById("uploadModal").classList.add("hidden");
            uploadProgress.classList.add("hidden");
            this.clearFileSelection();
            progressBar.style.width = "0%";
            progressPercent.textContent = "0%";
          }, 2000);
        }, 500);
      }

      progressBar.style.width = progress + "%";
      progressPercent.textContent = Math.round(progress) + "%";
    }, 200);
  }

  showUploadResult(message, type) {
    const uploadResult = document.getElementById("uploadResult");
    uploadResult.textContent = message;
    uploadResult.className = `mt-4 p-3 rounded-lg ${
      type === "success"
        ? "bg-green-100 text-green-800 border border-green-200"
        : "bg-red-100 text-red-800 border border-red-200"
    }`;
    uploadResult.classList.remove("hidden");
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  startVoiceInput() {
    const voiceIndicator = document.getElementById("voiceIndicator");
    const voiceStatus = document.getElementById("voiceStatus");

    voiceIndicator.classList.remove("hidden");
    voiceStatus.textContent = "Listening...";

    // In a real implementation, this would use the Web Speech API
    console.log("Voice input started");
  }

  stopVoiceInput() {
    const voiceIndicator = document.getElementById("voiceIndicator");
    const voiceStatus = document.getElementById("voiceStatus");

    voiceIndicator.classList.add("hidden");
    voiceStatus.textContent = "Stopped";

    console.log("Voice input stopped");
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle("dark-mode");

    const themeIcon = document.getElementById("themeToggle").querySelector("i");
    if (this.isDarkMode) {
      themeIcon.classList.remove("fa-moon");
      themeIcon.classList.add("fa-sun");
      document.body.classList.add("bg-slate-900");
      document.body.classList.remove(
        "bg-gradient-to-br",
        "from-slate-50",
        "to-blue-50"
      );
    } else {
      themeIcon.classList.remove("fa-sun");
      themeIcon.classList.add("fa-moon");
      document.body.classList.remove("bg-slate-900");
      document.body.classList.add(
        "bg-gradient-to-br",
        "from-slate-50",
        "to-blue-50"
      );
    }
  }

  // PHASE 7: Enhanced clear chat with security consideration
  clearChat() {
    const chatContainer = document.getElementById("chatContainer");
    const welcomeCard = document.getElementById("welcomeCard");

    // Remove all messages except the welcome card
    while (chatContainer.firstChild) {
      chatContainer.removeChild(chatContainer.firstChild);
    }

    // Re-add welcome card
    if (welcomeCard) {
      chatContainer.appendChild(welcomeCard);
      welcomeCard.style.display = "block";
    }

    // PHASE 7: Clear sensitive data from memory
    this.chatHistory = [];

    // PHASE 7: Clear conversation context
    this.apiService.clearConversationContext();

    // PHASE 7: Track chat clearance
    this.trackInteraction("chat_cleared", {
      sessionId: this.userSession.sessionId,
      messageCount: this.userSession.messageCount,
    });

    // Reset message count for new conversation
    this.userSession.messageCount = 0;
  }

  copyChat() {
    const chatText = this.chatHistory
      .map(
        (entry) =>
          `${entry.sender === "user" ? "You" : "AI Assistant"}: ${
            entry.message
          }`
      )
      .join("\n");

    navigator.clipboard.writeText(chatText).then(() => {
      const copyButton = document.getElementById("copyChat");
      const originalHTML = copyButton.innerHTML;

      copyButton.innerHTML = '<i class="fas fa-check text-sm"></i>';
      copyButton.classList.add("copied");

      setTimeout(() => {
        copyButton.innerHTML = originalHTML;
        copyButton.classList.remove("copied");
      }, 2000);
    });
  }

  showSettings() {
    // Enhanced settings display
    const settings = {
      "Dark Mode": this.isDarkMode ? "On" : "Off",
      "Voice Input": "Enabled",
      "File Upload": "Enabled",
      "Current AI Model": this.getModelDisplayName(
        this.userSession.preferredModel
      ),
      "Multi-Model Support": window.APP_CONFIG?.FEATURES?.MULTI_MODEL
        ? "Enabled"
        : "Disabled",
    };

    const settingsText = Object.entries(settings)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    alert("Settings:\n" + settingsText);
  }

  refreshStats() {
    // Simulate stats refresh
    const stats = [
      "totalChunks",
      "baseChunks",
      "uploadedDocs",
      "totalDocs",
      "searchCount",
    ];
    stats.forEach((stat) => {
      const element = document.getElementById(stat);
      if (element) {
        const current = parseInt(element.textContent);
        const newValue = Math.min(current + Math.floor(Math.random() * 3), 99);
        element.textContent = newValue;

        // Add animation
        element.classList.add("scale-110");
        setTimeout(() => {
          element.classList.remove("scale-110");
        }, 300);
      }
    });
  }

  updateStats() {
    const uploadedDocs = document.getElementById("uploadedDocs");
    const totalDocs = document.getElementById("totalDocs");
    const totalChunks = document.getElementById("totalChunks");

    if (uploadedDocs && totalDocs && totalChunks) {
      const currentUploaded = parseInt(uploadedDocs.textContent);
      const currentTotal = parseInt(totalDocs.textContent);
      const currentChunks = parseInt(totalChunks.textContent);

      uploadedDocs.textContent = currentUploaded + 1;
      totalDocs.textContent = currentTotal + 1;
      totalChunks.textContent =
        currentChunks + Math.floor(Math.random() * 5) + 1;
    }
  }
  // Add these methods to your ChatApp class in app.js

  // PHASE 9: Enterprise Security & Team Collaboration
  setupEnterpriseFeatures() {
    this.securityManager = new SecurityManager();
    this.teamCollaboration = new TeamCollaboration();

    // Add security indicators to UI
    this.addSecurityIndicators();
    this.setupComplianceFeatures();
  }

  addSecurityIndicators() {
    // Add security status to header
    const securityStatus = document.createElement("div");
    securityStatus.id = "securityStatus";
    securityStatus.className = "security-status secure";
    securityStatus.innerHTML = `
        <i class="fas fa-shield-alt"></i>
        <span>Secure</span>
    `;

    // Add to header
    const header = document.querySelector(
      "header .flex.items-center.space-x-3"
    );
    header.appendChild(securityStatus);

    // Update security status periodically
    this.updateSecurityStatus();
  }

  updateSecurityStatus() {
    setInterval(() => {
      const status = this.securityManager.getSecurityStatus();
      const securityStatus = document.getElementById("securityStatus");

      if (securityStatus) {
        let statusText = "Secure";
        let statusClass = "secure";

        if (status.threatsDetected > 0) {
          statusText = `${status.threatsDetected} Threats`;
          statusClass = "critical";
        } else if (!status.encryption) {
          statusText = "Unencrypted";
          statusClass = "warning";
        }

        securityStatus.className = `security-status ${statusClass}`;
        securityStatus.innerHTML = `
                <i class="fas fa-shield-alt"></i>
                <span>${statusText}</span>
            `;
      }
    }, 30000);
  }

  setupComplianceFeatures() {
    // Show GDPR/CCPA compliance banners if needed
    if (this.securityManager.securityConfig.COMPLIANCE.GDPR_ENABLED) {
      this.showGDPRBanner();
    }

    if (this.securityManager.securityConfig.COMPLIANCE.CCPA_ENABLED) {
      this.showCCPABanner();
    }
  }

  showGDPRBanner() {
    if (localStorage.getItem("gdpr_consent")) return;

    const banner = document.createElement("div");
    banner.className = "compliance-banner gdpr";
    banner.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <h3 class="font-semibold mb-2">Your Privacy Matters</h3>
                <p class="text-sm opacity-90">
                    We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
                </p>
            </div>
            <div class="compliance-actions">
                <button id="gdprAccept" class="compliance-btn">Accept</button>
                <button id="gdprReject" class="compliance-btn">Reject</button>
                <button id="gdprSettings" class="compliance-btn">Settings</button>
            </div>
        </div>
    `;

    document.body.insertBefore(banner, document.body.firstChild);
    this.setupGDPREvents();
  }

  setupGDPREvents() {
    document.getElementById("gdprAccept").addEventListener("click", () => {
      this.securityManager.setCookieConsent(true);
      document.querySelector(".compliance-banner").remove();
      localStorage.setItem("gdpr_consent", "true");
    });

    document.getElementById("gdprReject").addEventListener("click", () => {
      this.securityManager.setCookieConsent(false);
      document.querySelector(".compliance-banner").remove();
      localStorage.setItem("gdpr_consent", "false");
    });

    document.getElementById("gdprSettings").addEventListener("click", () => {
      this.showPrivacySettings();
    });
  }

  showPrivacySettings() {
    const settingsHTML = `
        <div id="privacySettingsModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl mx-4">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-slate-800">Privacy Settings</h3>
                    <button id="closePrivacySettings" class="text-slate-500 hover:text-slate-700 transition-colors">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>

                <div class="space-y-6">
                    <div class="security-settings">
                        <h4 class="font-semibold text-slate-800 mb-4">Data Collection</h4>
                        <div class="space-y-4">
                            <div class="security-setting-item">
                                <div class="security-setting-label">
                                    <div class="security-setting-name">Analytics & Usage Data</div>
                                    <div class="security-setting-description">
                                        Help us improve by sharing anonymous usage data
                                    </div>
                                </div>
                                <input type="checkbox" id="analyticsConsent" ${
                                  localStorage.getItem("analytics_consent") !==
                                  "false"
                                    ? "checked"
                                    : ""
                                }>
                            </div>
                            <div class="security-setting-item">
                                <div class="security-setting-label">
                                    <div class="security-setting-name">Personalized Experience</div>
                                    <div class="security-setting-description">
                                        Use your conversation history to provide better responses
                                    </div>
                                </div>
                                <input type="checkbox" id="personalizationConsent" ${
                                  localStorage.getItem(
                                    "personalization_consent"
                                  ) !== "false"
                                    ? "checked"
                                    : ""
                                }>
                            </div>
                        </div>
                    </div>

                    <div class="security-settings">
                        <h4 class="font-semibold text-slate-800 mb-4">Data Management</h4>
                        <div class="space-y-3">
                            <button id="exportDataBtn" class="w-full text-left p-3 hover:bg-slate-50 rounded-lg transition-colors border">
                                <i class="fas fa-download mr-3 text-blue-500"></i>
                                <div>
                                    <div class="font-medium">Export My Data</div>
                                    <div class="text-sm text-slate-500">Download all your conversations and preferences</div>
                                </div>
                            </button>
                            <button id="deleteDataBtn" class="w-full text-left p-3 hover:bg-slate-50 rounded-lg transition-colors border text-red-600">
                                <i class="fas fa-trash mr-3"></i>
                                <div>
                                    <div class="font-medium">Delete My Data</div>
                                    <div class="text-sm text-slate-500">Permanently remove all your data from our systems</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 mt-6">
                    <button id="savePrivacySettings" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", settingsHTML);
    this.setupPrivacySettingsEvents();
  }

  setupPrivacySettingsEvents() {
    document
      .getElementById("closePrivacySettings")
      .addEventListener("click", () => {
        document.getElementById("privacySettingsModal").remove();
      });

    document
      .getElementById("savePrivacySettings")
      .addEventListener("click", () => {
        const analyticsConsent =
          document.getElementById("analyticsConsent").checked;
        const personalizationConsent = document.getElementById(
          "personalizationConsent"
        ).checked;

        localStorage.setItem("analytics_consent", analyticsConsent.toString());
        localStorage.setItem(
          "personalization_consent",
          personalizationConsent.toString()
        );

        // Update feature flags based on consent
        if (window.APP_CONFIG) {
          window.APP_CONFIG.FEATURES.ANALYTICS = analyticsConsent;
          window.APP_CONFIG.FEATURES.PERSONALIZATION = personalizationConsent;
        }

        this.showNotification("Privacy settings saved", "success");
        document.getElementById("privacySettingsModal").remove();
      });

    document
      .getElementById("exportDataBtn")
      .addEventListener("click", async () => {
        try {
          const userData = await this.securityManager.exportUserData();
          this.downloadJSON(userData, "user-data-export.json");
          this.showNotification("Data exported successfully", "success");
        } catch (error) {
          this.showNotification("Failed to export data", "error");
        }
      });

    document
      .getElementById("deleteDataBtn")
      .addEventListener("click", async () => {
        if (
          confirm(
            "Are you sure you want to delete all your data? This action cannot be undone."
          )
        ) {
          try {
            const result = await this.securityManager.deleteUserData();
            this.showNotification(result.message, "success");
            this.clearChat(); // Clear current session
          } catch (error) {
            this.showNotification("Failed to delete data", "error");
          }
        }
      });
  }

  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Enhanced security for message sending
  async sendMessage() {
    // Security check before sending
    if (!this.securityCheck()) {
      this.showNotification(
        "Security check failed. Message not sent.",
        "error"
      );
      return;
    }

    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();

    if (!message) return;

    const startTime = performance.now();

    // Encrypt message if security is enabled
    let processedMessage = message;
    if (this.securityManager.securityConfig.ENCRYPTION.ENABLED) {
      try {
        processedMessage = await this.securityManager.encryptData({
          message: message,
          timestamp: new Date().toISOString(),
          sessionId: this.userSession.sessionId,
        });
      } catch (error) {
        console.warn("Encryption failed, sending plain text:", error);
      }
    }

    // Log the action for audit
    this.securityManager.auditLogger.log("CHAT", "message_sent", {
      messageLength: message.length,
      encrypted: this.securityManager.securityConfig.ENCRYPTION.ENABLED,
    });

    // Rest of the sendMessage implementation...
    // [Keep your existing sendMessage code here]
  }

  securityCheck() {
    // Perform various security checks
    const checks = [
      this.checkRateLimit(),
      this.checkSuspiciousContent(),
      this.checkSessionValidity(),
    ];

    return checks.every((check) => check === true);
  }

  checkRateLimit() {
    // Implement rate limiting
    const now = Date.now();
    const lastMessageTime = this.userSession.lastMessageTime || 0;
    const timeSinceLastMessage = now - lastMessageTime;

    if (timeSinceLastMessage < 1000) {
      // 1 second between messages
      this.securityManager.auditLogger.log("SECURITY", "rate_limit_exceeded", {
        timeSinceLastMessage,
      });
      return false;
    }

    this.userSession.lastMessageTime = now;
    return true;
  }

  checkSuspiciousContent(message) {
    // Check for potential security threats in message content
    const threats = this.securityManager.detectXSSPattern(message);

    if (threats) {
      this.securityManager.auditLogger.log(
        "SECURITY",
        "suspicious_content_detected",
        {
          message: message.substring(0, 100),
          threatType: "XSS_ATTEMPT",
        }
      );
      return false;
    }

    return true;
  }

  checkSessionValidity() {
    const sessionStart = sessionStorage.getItem("session_start");
    if (!sessionStart) return false;

    const sessionAge = Date.now() - new Date(sessionStart).getTime();
    return sessionAge < this.securityManager.securityConfig.SESSION.TIMEOUT;
  }

  // Update init method to include enterprise features
  init() {
    this.setupEventListeners();
    this.setupQuickQuestions();
    this.setupMessageInput();
    this.setupFileUpload();
    this.setupVoiceInput();
    this.setupModelSelector();
    this.setupAnalyticsDashboard();
    this.setupEnterpriseFeatures(); // PHASE 9
    this.loadSessionData();

    // Initialize analytics
    this.trackSessionStart();
  }

  // Add these methods to your ChatApp class in app.js

  // PHASE 8: Analytics Dashboard Integration
  setupAnalyticsDashboard() {
    this.analyticsDashboard = new AnalyticsDashboard();
    this.performanceOptimizer = new PerformanceOptimizer();

    // Add analytics button to header
    this.addAnalyticsButton();
  }

  addAnalyticsButton() {
    const analyticsBtn = document.createElement("button");
    analyticsBtn.id = "analyticsBtn";
    analyticsBtn.className =
      "p-2 rounded-xl hover:bg-slate-100 transition-all duration-200";
    analyticsBtn.innerHTML = '<i class="fas fa-chart-bar text-slate-600"></i>';
    analyticsBtn.title = "Analytics Dashboard";

    analyticsBtn.addEventListener("click", () => {
      this.analyticsDashboard.show();
    });

    // Add to header buttons
    const headerButtons = document.querySelector("header .flex.space-x-3");
    headerButtons.appendChild(analyticsBtn);
  }

  // Enhanced sendMessage method with analytics
  async sendMessage() {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();

    if (!message) return;

    const startTime = performance.now();

    // Add user message to chat
    this.addMessageToChat(message, "user");
    messageInput.value = "";
    messageInput.style.height = "auto";

    // Update session
    this.userSession.messageCount++;

    // Hide character counter
    document.getElementById("charCounter").classList.add("hidden");

    try {
      // PHASE 7: Show appropriate typing indicator
      const typingType = this.detectTypingType(message);
      this.realTimeTyping.showTypingIndicator(typingType);

      // PHASE 7: Analyze sentiment
      const sentiment = await this.apiService.analyzeSentiment(message);

      // PHASE 7: Get conversation context
      const context = this.apiService.getConversationContext();

      // PHASE 7: Enhanced chat with multi-model support
      const response = await this.apiService.chat(message, context, {
        modelType: this.userSession.preferredModel,
      });

      const responseTime = performance.now() - startTime;

      this.realTimeTyping.hideTypingIndicator();

      // PHASE 7: Add AI response with streaming effect
      await this.addStreamingResponse(
        response.response,
        sentiment,
        response.modelUsed
      );

      // PHASE 8: Record analytics
      this.recordAnalytics(
        message,
        response.response,
        response.modelUsed,
        responseTime,
        sentiment
      );

      // PHASE 7: Track successful interaction
      this.trackInteraction("message_sent", {
        model: response.modelUsed,
        sentiment: sentiment?.label,
        length: message.length,
        responseTime: responseTime,
      });
    } catch (error) {
      this.realTimeTyping.hideTypingIndicator();
      this.handleError("Failed to get response. Please try again.", error);

      // PHASE 8: Record error analytics
      this.recordErrorAnalytics(message, error);

      // PHASE 7: Track error
      this.trackInteraction("message_error", { error: error.message });
    }

    this.saveSessionData();
  }

  // PHASE 8: Analytics recording
  recordAnalytics(userMessage, aiResponse, modelUsed, responseTime, sentiment) {
    if (this.analyticsDashboard) {
      this.analyticsDashboard.recordMessage(
        userMessage,
        aiResponse,
        modelUsed,
        responseTime,
        sentiment
      );
    }

    // Record performance metrics
    if (this.performanceOptimizer) {
      this.performanceOptimizer.recordMetric(
        "chat_response_time",
        responseTime,
        {
          model: modelUsed,
          messageLength: userMessage.length,
        }
      );
    }
  }

  recordErrorAnalytics(userMessage, error) {
    if (this.performanceOptimizer) {
      this.performanceOptimizer.recordMetric("chat_error", 1, {
        errorType: error.name,
        message: userMessage.substring(0, 50),
      });
    }
  }

  // Update init method to include analytics
  init() {
    this.setupEventListeners();
    this.setupQuickQuestions();
    this.setupMessageInput();
    this.setupFileUpload();
    this.setupVoiceInput();
    this.setupModelSelector();
    this.setupAnalyticsDashboard(); // PHASE 8
    this.loadSessionData();

    // Initialize analytics
    this.trackSessionStart();
  }
}

// Initialize the app when DOM is loaded with security first
document.addEventListener("DOMContentLoaded", () => {
  // Wait for security services to initialize
  setTimeout(() => {
    window.chatApp = new ChatApp();

    // PHASE 7: Global security error handling
    window.addEventListener("error", (event) => {
      if (window.chatApp && window.chatApp.performanceMonitor) {
        window.chatApp.performanceMonitor.trackError(event.error, {
          type: "global_error",
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      }
    });

    window.addEventListener("unhandledrejection", (event) => {
      if (window.chatApp && window.chatApp.performanceMonitor) {
        window.chatApp.performanceMonitor.trackError(new Error(event.reason), {
          type: "unhandled_rejection",
        });
      }
    });
  }, 100);
});

// Export for use in other modules if needed
window.ChatApp = ChatApp;
