// app.js - Main application logic for AI Customer Service Platform

class ChatApp {
  constructor() {
    this.isDarkMode = false;
    this.chatHistory = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupQuickQuestions();
    this.setupMessageInput();
    this.setupFileUpload();
    this.setupVoiceInput();
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
    document.getElementById("settingsBtn").addEventListener("click", () => {
      this.showSettings();
    });

    // Copy chat
    document.getElementById("copyChat").addEventListener("click", () => {
      this.copyChat();
    });

    // Refresh stats
    document.getElementById("refreshStats").addEventListener("click", () => {
      this.refreshStats();
    });
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

  sendMessage() {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();

    if (message) {
      this.addMessageToChat(message, "user");
      messageInput.value = "";
      messageInput.style.height = "auto";

      // Hide character counter
      document.getElementById("charCounter").classList.add("hidden");

      // Show typing indicator
      this.showTypingIndicator();

      // Simulate AI response after a delay
      setTimeout(() => {
        this.hideTypingIndicator();
        const response = this.generateAIResponse(message);
        this.addMessageToChat(response, "bot");
      }, 1500 + Math.random() * 1000);
    }
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

  showTypingIndicator() {
    document.getElementById("typingIndicator").classList.remove("hidden");
  }

  hideTypingIndicator() {
    document.getElementById("typingIndicator").classList.add("hidden");
  }

  generateAIResponse(question) {
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

    // Check file size
    if (file.size > window.APP_CONFIG.MAX_FILE_SIZE) {
      this.showUploadResult("File size exceeds 10MB limit.", "error");
      return;
    }

    // Check file type
    const allowedTypes = [".pdf", ".docx", ".txt", ".md", ".csv"];
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      this.showUploadResult(
        "File type not supported. Please upload PDF, DOCX, TXT, MD, or CSV files.",
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
    // Simple settings alert - in a real app this would open a modal
    alert(
      "Settings:\n- Dark mode: " +
        (this.isDarkMode ? "On" : "Off") +
        "\n- Voice input: Enabled\n- File upload: Enabled"
    );
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
  new ChatApp();
});

// Export for use in other modules if needed
window.ChatApp = ChatApp;
