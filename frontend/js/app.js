// AI Customer Service Platform - Complete Working Version
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Starting AI Customer Service Platform...");
  window.aiCustomerService = new AICustomerService();
});

class AICustomerService {
  constructor() {
    this.chatHistory = [];
    this.currentUser = null;
    this.selectedFile = null;
    this.isQuestionnaireOpen = false;
    this.isDarkMode = false;
    this.isOnline = true;
    this.API_BASE_URL = "https://ai-customer-service-backend-rthi.onrender.com";

    this.init();
  }

  async init() {
    console.log("🔧 Initializing AI Customer Service...");

    try {
      this.findDOMElements();
      this.setupEventListeners();
      await this.loadSavedData();
      this.setupQuestionnaire();
      this.checkConnection();

      console.log("✅ AI Customer Service initialized successfully");
      this.showToast("AI Assistant is ready!", "success");
    } catch (error) {
      console.error("❌ Initialization failed:", error);
      this.showToast("Failed to initialize chat", "error");
    }
  }

  findDOMElements() {
    console.log("🔍 Finding DOM elements...");

    // Core Chat Elements
    this.chatContainer = document.getElementById("chatContainer");
    this.messageInput = document.getElementById("messageInput");
    this.sendButton = document.getElementById("sendButton");
    this.typingIndicator = document.getElementById("typingIndicator");
    this.welcomeCard = document.getElementById("welcomeCard");

    // Action Buttons
    this.clearChatButton = document.getElementById("clearChat");
    this.themeToggle = document.getElementById("themeToggle");
    this.uploadBtn = document.getElementById("uploadBtn");
    this.copyChat = document.getElementById("copyChat");

    // Questionnaire
    this.questionnaireToggle = document.getElementById("questionnaireToggle");
    this.questionnaireOptions = document.getElementById("questionnaireOptions");
    this.toggleIcon = document.getElementById("toggleIcon");

    // Voice Input
    this.voiceInputBtn = document.getElementById("voiceInputBtn");
    this.voiceModal = document.getElementById("voiceModal");
    this.stopVoice = document.getElementById("stopVoice");
    this.voiceStatus = document.getElementById("voiceStatus");

    // File Upload
    this.uploadModal = document.getElementById("uploadModal");
    this.closeModal = document.getElementById("closeModal");
    this.cancelUpload = document.getElementById("cancelUpload");
    this.fileInput = document.getElementById("fileInput");
    this.browseBtn = document.getElementById("browseBtn");
    this.fileInfo = document.getElementById("fileInfo");
    this.fileName = document.getElementById("fileName");
    this.fileSize = document.getElementById("fileSize");
    this.removeFile = document.getElementById("removeFile");
    this.confirmUpload = document.getElementById("confirmUpload");

    // Stats
    this.totalChunks = document.getElementById("totalChunks");
    this.uploadedDocs = document.getElementById("uploadedDocs");
    this.searchCount = document.getElementById("searchCount");

    console.log("✅ DOM elements found");
  }

  setupEventListeners() {
    console.log("🎯 Setting up event listeners...");

    // Core Chat
    this.sendButton?.addEventListener("click", () => this.sendMessage());
    this.messageInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    this.messageInput?.addEventListener("input", () => {
      this.autoResizeTextarea();
    });

    // Actions
    this.clearChatButton?.addEventListener("click", () => this.clearChat());
    this.themeToggle?.addEventListener("click", () => this.toggleTheme());
    this.uploadBtn?.addEventListener("click", () => this.openUploadModal());
    this.copyChat?.addEventListener("click", () => this.copyChatToClipboard());

    // Questionnaire
    this.questionnaireToggle?.addEventListener("click", () =>
      this.toggleQuestionnaire()
    );

    // Voice
    this.voiceInputBtn?.addEventListener("click", () => this.startVoiceInput());
    this.stopVoice?.addEventListener("click", () => this.stopVoiceInput());

    // File Upload
    this.closeModal?.addEventListener("click", () => this.closeUploadModal());
    this.cancelUpload?.addEventListener("click", () => this.closeUploadModal());
    this.browseBtn?.addEventListener("click", () => this.fileInput?.click());
    this.fileInput?.addEventListener("change", (e) => this.handleFileSelect(e));
    this.removeFile?.addEventListener("click", () => this.removeSelectedFile());
    this.confirmUpload?.addEventListener("click", () => this.uploadFile());

    // Network monitoring
    window.addEventListener("online", () => this.handleConnectionChange(true));
    window.addEventListener("offline", () =>
      this.handleConnectionChange(false)
    );

    console.log("✅ Event listeners setup complete");
  }

  setupQuestionnaire() {
    // Question tabs
    document.querySelectorAll(".question-tab").forEach((tab) => {
      tab.addEventListener("click", () => this.handleQuestionTabClick(tab));
    });

    // Quick questions
    document.querySelectorAll(".quick-question").forEach((question) => {
      question.addEventListener("click", () =>
        this.handleQuickQuestionClick(question)
      );
    });
  }

  async loadSavedData() {
    console.log("💾 Loading saved data...");

    try {
      // User ID
      this.currentUser =
        localStorage.getItem("userId") || this.generateUserId();
      localStorage.setItem("userId", this.currentUser);

      // Chat History
      const savedHistory = localStorage.getItem("chatHistory");
      if (savedHistory) {
        this.chatHistory = JSON.parse(savedHistory);
        if (this.chatHistory.length > 0) {
          this.welcomeCard.style.display = "none";
          this.chatHistory.forEach((msg) => {
            this.addMessageToChat(msg.text, msg.sender, false);
          });
        }
      }

      // Theme
      if (localStorage.getItem("darkMode") === "true") {
        this.enableDarkMode();
      }

      // Search Count
      this.searchCountValue =
        parseInt(localStorage.getItem("searchCount")) || 0;
      this.updateSearchCount();

      // Load knowledge stats
      await this.loadKnowledgeStats();

      console.log("✅ Saved data loaded");
    } catch (error) {
      console.warn("⚠️ Error loading saved data:", error);
    }
  }

  // ========== CORE CHAT FUNCTIONALITY ==========

  async sendMessage() {
    const message = this.messageInput?.value?.trim();

    if (!message) {
      this.showToast("Please enter a message", "warning");
      return;
    }

    console.log("💬 Sending message:", message);

    // Add user message
    this.addMessageToChat(message, "user");

    // Clear input
    this.messageInput.value = "";
    this.autoResizeTextarea();

    // Hide welcome card
    if (this.welcomeCard?.style.display !== "none") {
      this.welcomeCard.style.display = "none";
    }

    // Close questionnaire
    this.closeQuestionnaire();

    // Show typing indicator
    this.showTypingIndicator();

    // Increment search count
    this.incrementSearchCount();

    try {
      // Get AI response
      const response = await this.getAIResponse(message);
      this.hideTypingIndicator();
      this.addMessageToChat(response, "bot");
    } catch (error) {
      this.hideTypingIndicator();
      console.error("❌ Error getting AI response:", error);
      const fallback = this.getFallbackResponse(error);
      this.addMessageToChat(fallback, "bot");
      this.showToast("Failed to get response from AI", "error");
    }
  }

  async getAIResponse(message) {
    try {
      // Try real API first
      const response = await fetch(`${this.API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          userId: this.currentUser,
          conversationContext: this.chatHistory.slice(-4),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.response;
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.warn("🌐 API unavailable, using fallback:", error);
      // Fallback to simulated responses
      return this.getFallbackAIResponse(message);
    }
  }

  getFallbackAIResponse(message) {
    const lowerMessage = message.toLowerCase();

    const responses = {
      hello: "Hello! How can I assist you today?",
      hi: "Hi there! What can I help you with?",
      help: "I can help you with:\n• Business information\n• Technical support\n• Document analysis\n• General inquiries\n\nWhat do you need help with?",
      thank: "You're welcome! Is there anything else I can help you with?",
      hours:
        "Our business hours are:\nMonday - Friday: 9:00 AM - 6:00 PM EST\nSaturday: 10:00 AM - 2:00 PM EST",
      contact:
        "You can contact us through:\n📞 Phone: 1-800-123-4567\n📧 Email: support@company.com\n💬 Live Chat: Available 24/7",
      pricing:
        "We offer flexible pricing plans:\n• Basic: $29/month\n• Professional: $79/month\n• Enterprise: Custom pricing\n\nWhich plan interests you?",
      support:
        "Our technical support team is available 24/7. You can reach them via phone, email, or the live chat feature in your dashboard.",
      upload:
        'To upload documents:\n1. Click the "Upload Docs" button\n2. Select your file (PDF, DOCX, TXT)\n3. Wait for processing\n4. Ask questions about your document!',
      refund:
        "We offer a 30-day money-back guarantee. If you're not satisfied, contact our support team for a full refund.",
      service:
        "We provide:\n• AI-powered customer support\n• Document analysis\n• Knowledge base management\n• 24/7 availability\n\nWhich service are you interested in?",
    };

    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }

    // Default response for unknown queries
    return `I understand you're asking about "${message}". I'm an AI assistant trained to help with customer service inquiries. I can answer questions about our services, business hours, pricing, and more. Could you provide more specific details about what you need help with?`;
  }

  addMessageToChat(message, sender, saveToHistory = true) {
    if (!this.chatContainer) return;

    const messageElement = document.createElement("div");
    messageElement.className = `flex items-end space-x-2 ${
      sender === "user" ? "justify-end" : "justify-start"
    } message-entering`;

    if (sender === "user") {
      messageElement.innerHTML = `
                <div class="user-message px-4 py-3 max-w-xs md:max-w-md">
                    ${this.escapeHtml(message)}
                </div>
                <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <i class="fas fa-user text-white text-xs"></i>
                </div>
            `;
    } else {
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
    this.scrollToBottom();

    // Save to history
    if (saveToHistory) {
      this.chatHistory.push({
        text: message,
        sender: sender,
        timestamp: new Date().toISOString(),
      });

      // Keep only last 50 messages
      if (this.chatHistory.length > 50) {
        this.chatHistory.shift();
      }

      localStorage.setItem("chatHistory", JSON.stringify(this.chatHistory));
    }
  }

  // ========== QUESTIONNAIRE FUNCTIONALITY ==========

  toggleQuestionnaire() {
    if (this.isQuestionnaireOpen) {
      this.closeQuestionnaire();
    } else {
      this.openQuestionnaire();
    }
  }

  openQuestionnaire() {
    if (this.questionnaireOptions && this.toggleIcon) {
      this.questionnaireOptions.classList.remove("hidden");
      this.toggleIcon.classList.add("rotate-180");
      this.isQuestionnaireOpen = true;
    }
  }

  closeQuestionnaire() {
    if (this.questionnaireOptions && this.toggleIcon) {
      this.questionnaireOptions.classList.add("hidden");
      this.toggleIcon.classList.remove("rotate-180");
      this.isQuestionnaireOpen = false;
    }
  }

  handleQuestionTabClick(tab) {
    // Add click animation
    tab.style.transform = "scale(0.95)";
    setTimeout(() => {
      tab.style.transform = "";
    }, 150);

    if (tab.id === "uploadDocBtn") {
      this.openUploadModal();
    } else {
      const question = tab.getAttribute("data-question");
      if (question && this.messageInput) {
        this.messageInput.value = question;
        this.sendMessage();
      }
    }
  }

  handleQuickQuestionClick(question) {
    const questionText = question.getAttribute("data-question");
    if (questionText && this.messageInput) {
      this.messageInput.value = questionText;
      this.sendMessage();
      this.closeQuestionnaire();
    }
  }

  // ========== VOICE INPUT ==========

  startVoiceInput() {
    if (!("webkitSpeechRecognition" in window)) {
      this.showToast("Voice input is not supported in your browser", "warning");
      return;
    }

    this.showToast("Starting voice input... Speak now", "info");
    // Voice recognition implementation would go here
    // For now, simulate voice input
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.value = "This is a simulated voice input";
        this.autoResizeTextarea();
      }
    }, 1000);
  }

  stopVoiceInput() {
    this.showToast("Voice input stopped", "info");
    if (this.voiceModal) {
      this.voiceModal.classList.add("hidden");
    }
  }

  // ========== FILE UPLOAD ==========

  openUploadModal() {
    if (this.uploadModal) {
      this.uploadModal.classList.remove("hidden");
      this.resetUploadForm();
    }
  }

  closeUploadModal() {
    if (this.uploadModal) {
      this.uploadModal.classList.add("hidden");
      this.resetUploadForm();
    }
  }

  resetUploadForm() {
    this.selectedFile = null;
    if (this.fileInput) this.fileInput.value = "";
    if (this.fileInfo) this.fileInfo.classList.add("hidden");
    if (this.confirmUpload) this.confirmUpload.disabled = true;
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    const validTypes = [".pdf", ".docx", ".txt", ".md", ".csv"];
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();

    if (!validTypes.includes(fileExtension)) {
      this.showUploadResult(
        "Please select a PDF, DOCX, TXT, MD, or CSV file.",
        "error"
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.showUploadResult("File size must be less than 10MB.", "error");
      return;
    }

    this.selectedFile = file;
    this.updateFileInfo(file);
  }

  updateFileInfo(file) {
    if (this.fileName) this.fileName.textContent = file.name;
    if (this.fileSize)
      this.fileSize.textContent = this.formatFileSize(file.size);
    if (this.fileInfo) this.fileInfo.classList.remove("hidden");
    if (this.confirmUpload) this.confirmUpload.disabled = false;
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
    if (this.fileInput) this.fileInput.value = "";
    if (this.fileInfo) this.fileInfo.classList.add("hidden");
    if (this.confirmUpload) this.confirmUpload.disabled = true;
  }

  async uploadFile() {
    if (!this.selectedFile) return;

    this.showToast("Uploading file...", "info");

    try {
      const formData = new FormData();
      formData.append("file", this.selectedFile);

      const response = await fetch(`${this.API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        this.showUploadResult(`✅ ${result.message}`, "success");
        await this.loadKnowledgeStats();

        setTimeout(() => {
          this.closeUploadModal();
        }, 2000);
      } else {
        const error = await response.json();
        this.showUploadResult(`❌ ${error.error}`, "error");
      }
    } catch (error) {
      console.error("Upload error:", error);
      this.showUploadResult("❌ Upload failed. Please try again.", "error");
    }
  }

  // ========== UTILITY METHODS ==========

  showTypingIndicator() {
    if (this.typingIndicator) {
      this.typingIndicator.classList.remove("hidden");
      this.scrollToBottom();
    }
  }

  hideTypingIndicator() {
    if (this.typingIndicator) {
      this.typingIndicator.classList.add("hidden");
    }
  }

  autoResizeTextarea() {
    if (this.messageInput) {
      this.messageInput.style.height = "auto";
      this.messageInput.style.height = this.messageInput.scrollHeight + "px";
    }
  }

  scrollToBottom() {
    if (this.chatContainer) {
      this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  formatBotResponse(text) {
    return text.replace(/\n/g, "<br>");
  }

  generateUserId() {
    return "user-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
  }

  // ========== THEME MANAGEMENT ==========

  toggleTheme() {
    if (this.isDarkMode) {
      this.disableDarkMode();
    } else {
      this.enableDarkMode();
    }
  }

  enableDarkMode() {
    document.body.classList.add("dark-mode");
    if (this.themeToggle) {
      this.themeToggle.innerHTML = '<i class="fas fa-sun text-yellow-400"></i>';
    }
    this.isDarkMode = true;
    localStorage.setItem("darkMode", "true");
  }

  disableDarkMode() {
    document.body.classList.remove("dark-mode");
    if (this.themeToggle) {
      this.themeToggle.innerHTML = '<i class="fas fa-moon text-slate-600"></i>';
    }
    this.isDarkMode = false;
    localStorage.setItem("darkMode", "false");
  }

  // ========== KNOWLEDGE BASE ==========

  async loadKnowledgeStats() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/knowledge/stats`);
      if (response.ok) {
        const stats = await response.json();
        this.updateStatsDisplay(stats);
      }
    } catch (error) {
      console.warn("Failed to load knowledge stats:", error);
      // Set default values
      if (this.totalChunks) this.totalChunks.textContent = "8";
      if (this.uploadedDocs) this.uploadedDocs.textContent = "0";
    }
  }

  updateStatsDisplay(stats) {
    if (this.totalChunks)
      this.totalChunks.textContent = stats.total_chunks || "8";
    if (this.uploadedDocs)
      this.uploadedDocs.textContent = stats.uploaded_documents || "0";
  }

  // ========== SEARCH COUNT ==========

  incrementSearchCount() {
    this.searchCountValue++;
    this.updateSearchCount();
    localStorage.setItem("searchCount", this.searchCountValue.toString());
  }

  updateSearchCount() {
    if (this.searchCount) {
      this.searchCount.textContent = this.searchCountValue;
    }
  }

  // ========== CONNECTION MANAGEMENT ==========

  async checkConnection() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/health`);
      this.isOnline = response.ok;
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
      this.showToast("Working offline - some features limited", "warning");
    }
  }

  updateConnectionStatus() {
    // You can update a connection status indicator here
    console.log(this.isOnline ? "✅ Online" : "🌐 Offline");
  }

  getFallbackResponse(error) {
    if (!this.isOnline) {
      return "I'm currently offline. Please check your internet connection and try again.";
    }

    if (error.message.includes("timeout")) {
      return "The request timed out. Please try again in a moment.";
    }

    return "I'm having trouble connecting to the AI service right now. Please try again in a moment.";
  }

  // ========== NOTIFICATIONS ==========

  showToast(message, type = "info") {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);

    // Create toast element
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white shadow-lg transform transition-all duration-300 z-50 ${
      type === "success"
        ? "bg-green-500"
        : type === "warning"
        ? "bg-orange-500"
        : type === "error"
        ? "bg-red-500"
        : "bg-blue-500"
    }`;
    toast.textContent = message;
    toast.style.transform = "translateX(400px)";

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = "translateX(0)";
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.transform = "translateX(400px)";
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  showUploadResult(message, type) {
    this.showToast(message, type);
  }

  // ========== CHAT MANAGEMENT ==========

  async copyChatToClipboard() {
    const chatText = this.chatHistory
      .map((msg) => `${msg.sender === "user" ? "You" : "AI"}: ${msg.text}`)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(chatText);
      this.showToast("Chat copied to clipboard", "success");

      // Visual feedback on button
      if (this.copyChat) {
        const originalHTML = this.copyChat.innerHTML;
        this.copyChat.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
          this.copyChat.innerHTML = originalHTML;
        }, 2000);
      }
    } catch (error) {
      this.showToast("Failed to copy chat", "error");
    }
  }

  clearChat() {
    if (
      !confirm(
        "Are you sure you want to clear the chat history? This cannot be undone."
      )
    ) {
      return;
    }

    this.chatContainer.innerHTML = "";
    this.chatHistory = [];
    localStorage.removeItem("chatHistory");

    if (this.welcomeCard) {
      this.welcomeCard.style.display = "block";
    }

    this.addMessageToChat(
      "Hello! I'm your AI customer service assistant. How can I help you today?",
      "bot",
      false
    );

    this.showToast("Chat cleared", "success");
  }
}

// Fallback initialization
if (
  document.readyState === "interactive" ||
  document.readyState === "complete"
) {
  window.aiCustomerService = new AICustomerService();
}
