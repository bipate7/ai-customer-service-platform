// app.js - Enhanced Main Application Logic for AI Customer Service Platform - PHASE 7

class ChatApp {
  constructor() {
    this.isDarkMode = false;
    this.chatHistory = [];
    this.apiService = new APIService();
    this.realTimeTyping = new RealTimeTyping();
    this.userSession = this.initializeUserSession();
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
    this.loadSessionData();

    // Initialize analytics
    this.trackSessionStart();
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

  // PHASE 7: Enhanced Send Message with Multi-Model Support
  async sendMessage() {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();

    if (!message) return;

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

      this.realTimeTyping.hideTypingIndicator();

      // PHASE 7: Add AI response with streaming effect
      await this.addStreamingResponse(
        response.response,
        sentiment,
        response.modelUsed
      );

      // PHASE 7: Track successful interaction
      this.trackInteraction("message_sent", {
        model: response.modelUsed,
        sentiment: sentiment?.label,
        length: message.length,
      });
    } catch (error) {
      this.realTimeTyping.hideTypingIndicator();
      this.handleError("Failed to get response. Please try again.", error);

      // PHASE 7: Track error
      this.trackInteraction("message_error", { error: error.message });
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

  // PHASE 7: Enhanced error handling
  handleError(message, error) {
    console.error("Chat Error:", error);

    // Show user-friendly error
    this.showNotification(message, "error");

    // Add error message to chat
    this.addMessageToChat(
      "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
      "bot"
    );

    // PHASE 7: Fallback to fast model if primary fails
    if (this.userSession.preferredModel === "PRIMARY") {
      this.userSession.preferredModel = "FAST";
      this.showNotification(
        "Switched to faster model for better reliability",
        "info"
      );
      this.selectModel("FAST");
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

  // PHASE 7: Analytics and Tracking
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
      ...properties,
    };

    // In a real app, send to analytics service
    console.log("Analytics Event:", interactionData);

    // Store locally for debugging
    try {
      const analyticsLog = JSON.parse(
        localStorage.getItem("ai_chat_analytics") || "[]"
      );
      analyticsLog.push(interactionData);
      localStorage.setItem(
        "ai_chat_analytics",
        JSON.stringify(analyticsLog.slice(-100))
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
        this.userSession = { ...this.userSession, ...sessionData };

        // Restore selected model
        if (sessionData.preferredModel) {
          this.selectModel(sessionData.preferredModel);
        }
      }
    } catch (error) {
      console.warn("Failed to load session data:", error);
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

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Use config for file validation
    const validation = this.apiService.config?.validateFile?.(file) || {
      isValid:
        file.size <=
        (window.APP_CONFIG?.SECURITY?.MAX_FILE_SIZE || 10 * 1024 * 1024),
      errors: [],
    };

    if (!validation.isValid) {
      this.showUploadResult(
        validation.errors[0] || "File validation failed",
        "error"
      );
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

    this.chatHistory = [];
    // PHASE 7: Clear conversation context
    this.apiService.clearConversationContext();
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
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.chatApp = new ChatApp();
});

// Export for use in other modules if needed
window.ChatApp = ChatApp;
