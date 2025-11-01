// AI Customer Service Platform - Working Version

class AICustomerService {
  constructor() {
    this.initializeApp();
  }

  async initializeApp() {
    console.log("🚀 Initializing AI Customer Service Platform...");

    try {
      // Wait for DOM to be ready
      await this.waitForDOM();

      // Initialize DOM elements
      this.initializeDOMElements();

      // Initialize state
      this.initializeState();

      // Initialize event listeners
      this.initializeEventListeners();

      // Load any saved data
      await this.loadSavedData();

      console.log("✅ AI Customer Service Platform initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize application:", error);
    }
  }

  waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", resolve);
      } else {
        resolve();
      }
    });
  }

  initializeDOMElements() {
    console.log("🔍 Initializing DOM elements...");

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

    // Questionnaire Elements
    this.questionnaireToggle = document.getElementById("questionnaireToggle");
    this.questionnaireOptions = document.getElementById("questionnaireOptions");
    this.toggleIcon = document.getElementById("toggleIcon");

    // Voice Elements
    this.voiceInputBtn = document.getElementById("voiceInputBtn");
    this.voiceModal = document.getElementById("voiceModal");
    this.stopVoice = document.getElementById("stopVoice");
    this.voiceStatus = document.getElementById("voiceStatus");

    // File Upload Elements
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

    // Stats Elements
    this.totalChunks = document.getElementById("totalChunks");
    this.uploadedDocs = document.getElementById("uploadedDocs");

    // Verify critical elements exist
    if (!this.chatContainer || !this.messageInput || !this.sendButton) {
      console.error("❌ Critical DOM elements missing!");
      throw new Error("Required DOM elements not found");
    }

    console.log("✅ DOM elements initialized successfully");
  }

  initializeState() {
    console.log("🔧 Initializing application state...");

    this.chatHistory = [];
    this.currentUser = null;
    this.selectedFile = null;
    this.isQuestionnaireOpen = false;
    this.isVoiceActive = false;
    this.isDarkMode = false;
    this.isOnline = true;

    // API Configuration
    this.API_BASE_URL = "https://ai-customer-service-backend-rthi.onrender.com";

    console.log("✅ Application state initialized");
  }

  initializeEventListeners() {
    console.log("🎯 Initializing event listeners...");

    // Core Chat Functionality
    this.sendButton.addEventListener("click", () => this.sendMessage());
    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    this.messageInput.addEventListener("input", () => {
      this.autoResizeTextarea();
    });

    // Action Buttons
    this.clearChatButton.addEventListener("click", () => this.clearChat());
    this.themeToggle.addEventListener("click", () => this.toggleTheme());
    this.uploadBtn.addEventListener("click", () => this.openUploadModal());

    // Questionnaire
    this.questionnaireToggle.addEventListener("click", () =>
      this.toggleQuestionnaire()
    );

    // Voice Input
    if (this.voiceInputBtn) {
      this.voiceInputBtn.addEventListener("click", () =>
        this.startVoiceInput()
      );
    }
    if (this.stopVoice) {
      this.stopVoice.addEventListener("click", () => this.stopVoiceInput());
    }

    // File Upload
    this.closeModal.addEventListener("click", () => this.closeUploadModal());
    this.cancelUpload.addEventListener("click", () => this.closeUploadModal());
    this.browseBtn.addEventListener("click", () => this.fileInput.click());
    this.fileInput.addEventListener("change", (e) => this.handleFileSelect(e));
    this.removeFile.addEventListener("click", () => this.removeSelectedFile());
    this.confirmUpload.addEventListener("click", () => this.uploadFile());

    // Question Tabs
    const questionTabs = document.querySelectorAll(".question-tab");
    questionTabs.forEach((tab) => {
      tab.addEventListener("click", () => this.handleQuestionTabClick(tab));
    });

    // Quick Questions
    const quickQuestions = document.querySelectorAll(".quick-question");
    quickQuestions.forEach((question) => {
      question.addEventListener("click", () =>
        this.handleQuickQuestionClick(question)
      );
    });

    console.log("✅ Event listeners initialized");
  }

  async loadSavedData() {
    console.log("💾 Loading saved data...");

    try {
      // Load user ID
      this.currentUser =
        localStorage.getItem("userId") || this.generateUserId();
      localStorage.setItem("userId", this.currentUser);

      // Load chat history
      const savedHistory = localStorage.getItem("chatHistory");
      if (savedHistory) {
        this.chatHistory = JSON.parse(savedHistory);

        // Display saved messages
        if (this.chatHistory.length > 0) {
          this.welcomeCard.style.display = "none";
          this.chatHistory.forEach((message) => {
            this.addMessageToChat(message.text, message.sender, false);
          });
        }
      }

      // Load theme
      if (localStorage.getItem("darkMode") === "true") {
        this.enableDarkMode();
      }

      // Load knowledge stats
      await this.loadKnowledgeStats();

      console.log("✅ Saved data loaded successfully");
    } catch (error) {
      console.warn("⚠️ Failed to load some saved data:", error);
    }
  }

  // ========== CORE CHAT FUNCTIONALITY ==========

  async sendMessage() {
    const message = this.messageInput.value.trim();

    if (!message) {
      this.showToast("Please enter a message", "warning");
      return;
    }

    console.log("💬 Sending message:", message);

    // Add user message to chat
    this.addMessageToChat(message, "user");

    // Clear input
    this.messageInput.value = "";
    this.autoResizeTextarea();

    // Hide welcome card
    if (this.welcomeCard.style.display !== "none") {
      this.welcomeCard.style.display = "none";
    }

    // Close questionnaire if open
    this.closeQuestionnaire();

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Get AI response
      const botResponse = await this.getAIResponse(message);
      this.hideTypingIndicator();
      this.addMessageToChat(botResponse, "bot");
    } catch (error) {
      this.hideTypingIndicator();
      console.error("❌ Error getting AI response:", error);
      const fallbackResponse =
        "I'm having trouble connecting right now. Please try again in a moment.";
      this.addMessageToChat(fallbackResponse, "bot");
      this.showToast("Failed to get response", "error");
    }
  }

  async getAIResponse(message) {
    // Simulate API call - replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const responses = {
          hello: "Hello! How can I assist you today?",
          hi: "Hi there! What can I help you with?",
          help: "I'm here to help! You can ask me about our services, business hours, or upload documents for me to analyze.",
          default:
            "Thank you for your message! I'm an AI assistant trained to help with customer service inquiries. How can I assist you today?",
        };

        const lowerMessage = message.toLowerCase();
        const response = responses[lowerMessage] || responses.default;
        resolve(response);
      }, 1000);
    });

    // Uncomment for real API call:
    /*
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

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.response;
        */
  }

  addMessageToChat(message, sender, saveToHistory = true) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", "flex", "items-end", "space-x-2");

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
                    ${this.escapeHtml(message)}
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
        this.chatHistory = this.chatHistory.slice(-50);
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
    this.questionnaireOptions.classList.remove("hidden");
    this.toggleIcon.classList.add("rotate-180");
    this.isQuestionnaireOpen = true;
  }

  closeQuestionnaire() {
    this.questionnaireOptions.classList.add("hidden");
    this.toggleIcon.classList.remove("rotate-180");
    this.isQuestionnaireOpen = false;
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
      this.messageInput.value = question;
      this.sendMessage();
    }
  }

  handleQuickQuestionClick(question) {
    const questionText = question.getAttribute("data-question");
    this.messageInput.value = questionText;
    this.sendMessage();
    this.closeQuestionnaire();
  }

  // ========== VOICE INPUT FUNCTIONALITY ==========

  startVoiceInput() {
    if (!("webkitSpeechRecognition" in window)) {
      this.showToast("Voice input not supported in your browser", "warning");
      return;
    }

    this.showToast("Voice input started - speak now", "info");
    // Voice recognition implementation would go here
  }

  stopVoiceInput() {
    this.isVoiceActive = false;
    if (this.voiceModal) {
      this.voiceModal.classList.add("hidden");
    }
    this.showToast("Voice input stopped", "info");
  }

  // ========== FILE UPLOAD FUNCTIONALITY ==========

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
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Basic file validation
    const validTypes = [".pdf", ".docx", ".txt"];
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();

    if (!validTypes.includes(fileExtension)) {
      this.showUploadResult("Please select a PDF, DOCX, or TXT file.", "error");
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

    this.showToast("Uploading file...", "info");

    // Simulate upload - replace with actual upload
    setTimeout(() => {
      this.showUploadResult("✅ File uploaded successfully!", "success");
      this.loadKnowledgeStats();

      setTimeout(() => {
        this.closeUploadModal();
      }, 2000);
    }, 2000);

    // Uncomment for real upload:
    /*
        const formData = new FormData();
        formData.append("file", this.selectedFile);

        try {
            const response = await fetch(`${this.API_BASE_URL}/api/upload`, {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                this.showUploadResult(`✅ ${result.message}`, "success");
                await this.loadKnowledgeStats();
                
                setTimeout(() => {
                    this.closeUploadModal();
                }, 2000);
            } else {
                this.showUploadResult(`❌ ${result.error}`, "error");
            }
        } catch (error) {
            this.showUploadResult("❌ Upload failed. Please try again.", "error");
        }
        */
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
    this.messageInput.style.height = "auto";
    this.messageInput.style.height = this.messageInput.scrollHeight + "px";
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

  // ========== KNOWLEDGE BASE ==========

  async loadKnowledgeStats() {
    try {
      // Simulate API call - replace with actual API call
      const stats = {
        total_chunks: 8,
        uploaded_documents: 0,
      };

      this.updateStatsDisplay(stats);

      // Uncomment for real API call:
      /*
            const response = await fetch(`${this.API_BASE_URL}/api/knowledge/stats`);
            if (response.ok) {
                const stats = await response.json();
                this.updateStatsDisplay(stats);
            }
            */
    } catch (error) {
      console.warn("Failed to load knowledge stats:", error);
    }
  }

  updateStatsDisplay(stats) {
    if (this.totalChunks) {
      this.totalChunks.textContent = stats.total_chunks;
    }
    if (this.uploadedDocs) {
      this.uploadedDocs.textContent = stats.uploaded_documents;
    }
  }

  // ========== NOTIFICATIONS ==========

  showToast(message, type = "info") {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);

    // Create toast element
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white shadow-lg transform transition-transform duration-300 z-50 ${
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

    // Animate in
    setTimeout(() => {
      toast.classList.remove("translate-x-full");
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add("translate-x-full");
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
    this.welcomeCard.style.display = "block";

    this.addMessageToChat(
      "Hello! I'm your AI customer service assistant. How can I help you today?",
      "bot",
      false
    );

    this.showToast("Chat cleared", "success");
  }
}

// Initialize the application when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  console.log("📄 DOM fully loaded, initializing application...");
  window.aiCustomerService = new AICustomerService();
});

// Fallback initialization
if (
  document.readyState === "interactive" ||
  document.readyState === "complete"
) {
  console.log("📄 DOM already ready, initializing application...");
  window.aiCustomerService = new AICustomerService();
}
