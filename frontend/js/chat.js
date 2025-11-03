// chat.js - Enhanced Chat Management for AI Customer Service Platform - PHASE 7

class ChatManager {
  constructor() {
    this.conversationId = this.getConversationId();
    this.isAIResponding = false;
    this.userId = this.getUserId();
    this.conversationContext = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupFileUpload();
    this.setupKnowledgeSearch();
    this.setupPerformanceMonitoring();
    this.loadPreviousConversation();
    this.setupAutoSave();

    console.log("🚀 Chat Manager Initialized with RAG Support");

    // Initialize security features if available
    if (window.securityService) {
      this.setupSecurityFeatures();
    }
  }

  getConversationId() {
    let convId = sessionStorage.getItem("conversationId");
    if (!convId) {
      convId =
        "conv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem("conversationId", convId);
    }
    return convId;
  }

  getUserId() {
    let userId = localStorage.getItem("userId");
    if (!userId) {
      userId = "user_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("userId", userId);
    }
    return userId;
  }

  setupEventListeners() {
    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendMessage");

    // Send message on button click
    sendButton.addEventListener("click", () => {
      this.sendMessage();
    });

    // Send message on Enter key (with Shift for new line)
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    messageInput.addEventListener("input", () => {
      this.autoResizeTextarea(messageInput);
    });

    // Quick suggestions
    document.querySelectorAll(".suggestion-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const suggestion = e.target.textContent.trim();
        this.useSuggestion(suggestion);
      });
    });

    // Quick action buttons
    document.querySelectorAll(".quick-action-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const action = e.target.dataset.action;
        this.handleQuickAction(action);
      });
    });

    // Clear chat button
    const clearChatBtn = document.getElementById("clearChat");
    if (clearChatBtn) {
      clearChatBtn.addEventListener("click", () => {
        this.clearChat();
      });
    }

    // Feedback buttons
    document.querySelectorAll(".feedback-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const isHelpful = e.target.classList.contains("like");
        this.submitFeedback(isHelpful);
      });
    });
  }

  setupSecurityFeatures() {
    // Security monitoring for chat inputs
    const messageInput = document.getElementById("messageInput");

    messageInput.addEventListener("input", (e) => {
      if (window.securityService) {
        const validation = window.securityService.validateInput(e.target.value);
        if (!validation.isValid) {
          this.showNotification(
            "Please check your input for security issues",
            "warning"
          );
        }
      }
    });
  }

  autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }

  useSuggestion(suggestion) {
    const messageInput = document.getElementById("messageInput");
    messageInput.value = suggestion;
    messageInput.focus();
    this.autoResizeTextarea(messageInput);
  }

  handleQuickAction(action) {
    const messages = {
      billing: "I need help with billing or payment issues",
      technical: "I'm experiencing technical problems",
      account: "I need help with my account settings",
      refund: "I want to request a refund",
    };

    if (messages[action]) {
      document.getElementById("messageInput").value = messages[action];
      document.getElementById("messageInput").focus();
    }
  }

  async sendMessage() {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();

    if (!message || this.isAIResponding) return;

    // Security validation
    if (
      window.securityService &&
      !window.securityService.validateInput(message).isValid
    ) {
      this.showNotification(
        "Message contains potentially unsafe content",
        "error"
      );
      return;
    }

    // Clear input and reset height
    messageInput.value = "";
    messageInput.style.height = "auto";

    // Add user message to chat
    await this.addMessage("user", message);

    // Show typing indicator
    this.showTypingIndicator();

    // Disable send button
    this.setSendButtonState(false);

    try {
      // Get AI response from RAG-enhanced backend
      const aiResponse = await this.getAIResponse(message);

      // Remove typing indicator
      this.hideTypingIndicator();

      // Add AI response to chat
      await this.addMessage("ai", aiResponse);

      // Update conversation context
      this.updateConversationContext(message, aiResponse);

      // Log successful interaction
      this.logInteraction("message_sent", {
        messageLength: message.length,
        hasResponse: true,
      });
    } catch (error) {
      console.error("Error getting AI response:", error);
      this.hideTypingIndicator();

      // Show error message
      await this.addMessage(
        "ai",
        "I apologize, but I'm having trouble responding right now. Please try again in a moment."
      );

      this.logInteraction("ai_response_error", {
        error: error.message,
      });
    } finally {
      // Re-enable send button
      this.setSendButtonState(true);
    }
  }

  async addMessage(sender, content) {
    const messagesContainer = document.getElementById("messagesContainer");

    // Create message element
    const messageElement = this.createMessageElement(sender, content);

    // Add to container
    messagesContainer.appendChild(messageElement);

    // Scroll to bottom
    this.scrollToBottom();

    // Save to Firebase
    const messageData = {
      sender: sender,
      content: content,
      timestamp: new Date().toISOString(),
    };

    try {
      await saveMessageToFirebase(this.conversationId, messageData);
    } catch (error) {
      console.error("Error saving message to Firebase:", error);
    }

    return messageElement;
  }

  createMessageElement(sender, content) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;

    const avatarIcon = sender === "user" ? "fas fa-user" : "fas fa-robot";
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="${avatarIcon}"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="message-text">${this.formatMessageContent(
                      content
                    )}</div>
                    <span class="message-time">${time}</span>
                </div>
            </div>
        `;

    // Add fade-in animation
    messageDiv.style.opacity = "0";
    messageDiv.style.transform = "translateY(10px)";

    setTimeout(() => {
      messageDiv.style.transition = "all 0.3s ease";
      messageDiv.style.opacity = "1";
      messageDiv.style.transform = "translateY(0)";
    }, 10);

    return messageDiv;
  }

  formatMessageContent(content) {
    // Preserve line breaks and basic formatting
    let formattedContent = this.escapeHtml(content);

    // Convert line breaks to <br> tags
    formattedContent = formattedContent.replace(/\n/g, "<br>");

    return formattedContent;
  }

  showTypingIndicator() {
    this.isAIResponding = true;
    const typingIndicator = document.getElementById("typingIndicator");
    if (typingIndicator) {
      typingIndicator.classList.remove("hidden");
    }
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.isAIResponding = false;
    const typingIndicator = document.getElementById("typingIndicator");
    if (typingIndicator) {
      typingIndicator.classList.add("hidden");
    }
  }

  setSendButtonState(enabled) {
    const sendButton = document.getElementById("sendMessage");
    const messageInput = document.getElementById("messageInput");

    if (enabled) {
      sendButton.disabled = false;
      sendButton.classList.remove("opacity-50", "cursor-not-allowed");
      messageInput.disabled = false;
    } else {
      sendButton.disabled = true;
      sendButton.classList.add("opacity-50", "cursor-not-allowed");
      messageInput.disabled = true;
    }
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById("messagesContainer");
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  async loadPreviousConversation() {
    try {
      const conversation = await loadChatFromFirebase(this.conversationId);

      if (
        conversation &&
        conversation.messages &&
        conversation.messages.length > 0
      ) {
        // Clear current messages
        const messagesContainer = document.getElementById("messagesContainer");
        messagesContainer.innerHTML = "";

        // Add all messages from history
        for (const msg of conversation.messages) {
          await this.addMessage(msg.sender, msg.content);

          // Update conversation context
          if (msg.sender === "user" || msg.sender === "ai") {
            this.conversationContext.push({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.content,
            });
          }
        }

        console.log(
          "✅ Previous conversation loaded:",
          conversation.messages.length,
          "messages"
        );
      } else {
        // Add welcome message for new conversation
        await this.addMessage(
          "ai",
          "Hello! I'm your AI customer support assistant. How can I help you today? 😊"
        );
      }
    } catch (error) {
      console.error("Error loading previous conversation:", error);
      // Add welcome message as fallback
      await this.addMessage(
        "ai",
        "Hello! I'm your AI customer support assistant. How can I help you today? 😊"
      );
    }
  }

  setupAutoSave() {
    // Auto-save conversation every 30 seconds
    setInterval(() => {
      this.forceSaveConversation();
    }, 30000);
  }

  async forceSaveConversation() {
    // Force save current conversation state
    console.log("💾 Auto-save triggered");
  }

  async getAIResponse(userMessage) {
    try {
      const startTime = Date.now();

      const API_BASE_URL =
        window.location.hostname === "localhost"
          ? "http://localhost:5000"
          : "https://ai-customer-service-backend-rthi.onrender.com";

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          userId: this.userId,
          conversationContext: this.conversationContext.slice(-10), // Last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      console.log(`✅ AI Response received in ${responseTime}ms`);
      console.log(`🤖 RAG System: ${data.system || "Standard"}`);

      return data.response;
    } catch (error) {
      console.error("Error getting AI response:", error);

      // Fallback to enhanced rule-based responses
      return this.getEnhancedFallbackResponse(userMessage);
    }
  }

  getEnhancedFallbackResponse(userMessage) {
    const messageLower = userMessage.toLowerCase();

    // Define keyword arrays for each category
    const passwordKeywords = ["password", "reset", "forgot", "login"];
    const billingKeywords = ["billing", "payment", "charge", "invoice"];
    const technicalKeywords = [
      "technical",
      "bug",
      "error",
      "not working",
      "issue",
    ];
    const accountKeywords = ["account", "profile", "settings"];

    // Check if any password keywords exist in the message
    if (passwordKeywords.some((word) => messageLower.includes(word))) {
      return "I can help you reset your password! Please visit the login page and click 'Forgot Password'. You'll receive an email with a reset link that's valid for 2 hours. Need more help? Contact our support team.";
    }

    // Check if any billing keywords exist in the message
    if (billingKeywords.some((word) => messageLower.includes(word))) {
      return "For billing assistance, you can check your Billing History, update payment methods in Settings, or contact billing@company.com for specific issues. We're here to help!";
    }

    // Check if any technical keywords exist in the message
    if (technicalKeywords.some((word) => messageLower.includes(word))) {
      return "Technical issues can be frustrating! Try these steps: 1) Clear cache/cookies 2) Restart the app 3) Check your internet connection. If problems continue, provide more details about the error.";
    }

    // Check if any account keywords exist in the message
    if (accountKeywords.some((word) => messageLower.includes(word))) {
      return "For account management, you can update your profile in Settings, change your email (verification required), or manage privacy settings. What specific account help do you need?";
    }

    return "I understand you're asking about this. Our AI system is currently optimizing its response. Could you provide a bit more detail so I can assist you better?";
  }
  updateConversationContext(userMessage, aiResponse) {
    // Keep only last 10 messages for context
    if (this.conversationContext.length >= 20) {
      this.conversationContext = this.conversationContext.slice(-18);
    }

    this.conversationContext.push(
      { role: "user", content: userMessage },
      { role: "assistant", content: aiResponse }
    );
  }

  getConversationHistory() {
    const messagesContainer = document.getElementById("messagesContainer");
    const messages = messagesContainer.querySelectorAll(".message");
    const history = [];

    messages.forEach((message) => {
      if (message.classList.contains("user-message")) {
        const content = message.querySelector(".message-text").textContent;
        history.push({ sender: "user", content: content });
      } else if (message.classList.contains("ai-message")) {
        const content = message.querySelector(".message-text").textContent;
        history.push({ sender: "assistant", content: content });
      }
    });

    return history;
  }

  // FILE UPLOAD FUNCTIONALITY
  setupFileUpload() {
    const uploadBtn = document.createElement("button");
    uploadBtn.className = "text-gray-400 hover:text-gray-600 transition-colors";
    uploadBtn.innerHTML = '<i class="fas fa-upload"></i>';
    uploadBtn.title = "Upload Document";
    uploadBtn.addEventListener("click", () => this.openFileUpload());

    // Add to input area buttons
    const inputButtons = document.querySelector(".absolute.right-3.bottom-3");
    if (inputButtons) {
      inputButtons.appendChild(uploadBtn);
    }

    // Create file input element
    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = ".pdf,.docx,.txt";
    this.fileInput.style.display = "none";
    this.fileInput.addEventListener("change", (e) => this.handleFileUpload(e));

    document.body.appendChild(this.fileInput);
  }

  openFileUpload() {
    this.fileInput.click();
  }

  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [".pdf", ".docx", ".txt"];
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();

    if (!validTypes.includes(fileExtension)) {
      this.showNotification("Please select a PDF, DOCX, or TXT file", "error");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      this.showNotification("File size must be less than 10MB", "error");
      return;
    }

    try {
      this.showNotification(`📄 Uploading ${file.name}...`, "info");

      const formData = new FormData();
      formData.append("file", file);

      const API_BASE_URL =
        window.location.hostname === "localhost"
          ? "http://localhost:5000"
          : "https://ai-customer-service-backend-rthi.onrender.com";

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      this.showNotification(
        "✅ Document uploaded successfully! The AI can now use this information.",
        "success"
      );

      // Update knowledge base stats
      this.updateKnowledgeStats();

      this.logInteraction("document_uploaded", {
        filename: file.name,
        size: file.size,
        chunksAdded: result.chunks_added,
      });
    } catch (error) {
      console.error("Upload error:", error);
      this.showNotification("❌ Upload failed. Please try again.", "error");
    }

    // Reset file input
    event.target.value = "";
  }

  async updateKnowledgeStats() {
    try {
      const API_BASE_URL =
        window.location.hostname === "localhost"
          ? "http://localhost:5000"
          : "https://ai-customer-service-backend-rthi.onrender.com";

      const response = await fetch(`${API_BASE_URL}/api/knowledge/stats`);
      if (response.ok) {
        const stats = await response.json();

        // Update UI with knowledge base info
        const statusElement = document.querySelector(".bg-green-50");
        if (statusElement) {
          const statsText = statusElement.querySelector(".text-xs");
          if (statsText) {
            statsText.textContent = `Knowledge Base: ${stats.total_chunks} chunks | ${stats.uploaded_documents} documents`;
          }
        }
      }
    } catch (error) {
      console.error("Failed to update stats:", error);
    }
  }

  // KNOWLEDGE SEARCH FUNCTIONALITY
  setupKnowledgeSearch() {
    const searchInput = document.getElementById("knowledgeSearch");
    if (!searchInput) return;

    const searchResults = document.getElementById("searchResults");

    let searchTimeout;

    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.performKnowledgeSearch(e.target.value);
      }, 500);
    });

    searchInput.addEventListener("focus", () => {
      if (searchInput.value) {
        this.performKnowledgeSearch(searchInput.value);
      }
    });

    // Close search results when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !searchInput.contains(e.target) &&
        (!searchResults || !searchResults.contains(e.target))
      ) {
        if (searchResults) {
          searchResults.classList.add("hidden");
        }
      }
    });
  }

  async performKnowledgeSearch(query) {
    const searchResults = document.getElementById("searchResults");
    if (!searchResults || !query.trim()) {
      if (searchResults) {
        searchResults.classList.add("hidden");
      }
      return;
    }

    try {
      const API_BASE_URL =
        window.location.hostname === "localhost"
          ? "http://localhost:5000"
          : "https://ai-customer-service-backend-rthi.onrender.com";

      const response = await fetch(`${API_BASE_URL}/api/knowledge/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      this.displaySearchResults(data.results);
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  displaySearchResults(results) {
    const container = document.getElementById("searchResults");
    if (!container) return;

    if (results.length === 0) {
      container.innerHTML =
        '<p class="text-sm text-gray-500 p-2">No results found</p>';
      container.classList.remove("hidden");
      return;
    }

    container.innerHTML = results
      .map(
        (result) => `
            <div class="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer" 
                 onclick="window.chatManager.useSearchResult('${this.escapeHtml(
                   result.content.substring(0, 100)
                 )}...')">
                <div class="flex justify-between items-start mb-1">
                    <span class="text-xs px-2 py-1 rounded ${
                      result.source === "base_knowledge"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }">
                        ${result.source.replace("_", " ")}
                    </span>
                    <span class="text-xs text-gray-500">${(
                      result.similarity * 100
                    ).toFixed(1)}% match</span>
                </div>
                <p class="text-sm text-gray-700 line-clamp-2">${this.escapeHtml(
                  result.content
                )}</p>
            </div>
        `
      )
      .join("");

    container.classList.remove("hidden");
  }

  useSearchResult(content) {
    const messageInput = document.getElementById("messageInput");
    if (messageInput) {
      messageInput.value = `Tell me more about: ${content}`;
      messageInput.focus();
    }

    const searchResults = document.getElementById("searchResults");
    const knowledgeSearch = document.getElementById("knowledgeSearch");

    if (searchResults) searchResults.classList.add("hidden");
    if (knowledgeSearch) knowledgeSearch.value = "";
  }

  // PERFORMANCE MONITORING
  setupPerformanceMonitoring() {
    // Monitor response times
    this.responseTimes = [];

    // Update status with performance info every 30 seconds
    setInterval(() => {
      this.updatePerformanceStatus();
    }, 30000);
  }

  async updatePerformanceStatus() {
    try {
      const API_BASE_URL =
        window.location.hostname === "localhost"
          ? "http://localhost:5000"
          : "https://ai-customer-service-backend-rthi.onrender.com";

      const response = await fetch(`${API_BASE_URL}/api/performance/metrics`);
      if (response.ok) {
        const metrics = await response.json();

        // Update status indicator with performance info
        const avgResponseTime =
          metrics.performance_metrics?.ai_response?.average_time || 0;
        const statusElement = document.querySelector(".bg-green-50 .text-xs");

        if (statusElement && avgResponseTime > 0) {
          statusElement.textContent = `Avg response: ${avgResponseTime.toFixed(
            2
          )}s | Cache hit rate: ${metrics.cache_stats?.hit_rate || 0}%`;
        }
      }
    } catch (error) {
      console.error("Performance monitoring error:", error);
    }
  }

  // FEEDBACK SYSTEM
  async submitFeedback(isHelpful) {
    const feedbackBtn = isHelpful
      ? document.querySelector(".feedback-btn.like")
      : document.querySelector(".feedback-btn.dislike");

    // Add visual feedback
    if (feedbackBtn) {
      feedbackBtn.classList.add("success");
    }

    try {
      // Save feedback to Firebase
      await saveFeedbackToFirebase({
        helpful: isHelpful,
        timestamp: new Date(),
        conversationId: this.conversationId,
        messageCount: this.conversationContext.length,
      });

      // Show thank you message
      this.showFeedbackThankYou(isHelpful);

      setTimeout(() => {
        if (feedbackBtn) {
          feedbackBtn.classList.remove("success");
        }
      }, 1000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      this.showNotification("Error submitting feedback", "error");
    }
  }

  showFeedbackThankYou(isHelpful) {
    const message = isHelpful
      ? "Thank you for your positive feedback! 😊"
      : "Thank you for your feedback. We'll use this to improve. 🙏";

    this.showNotification(message, "success");
  }

  // NOTIFICATION SYSTEM
  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 ${
      type === "success"
        ? "bg-green-500 text-white"
        : type === "error"
        ? "bg-red-500 text-white"
        : "bg-blue-500 text-white"
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // SECURITY AND LOGGING
  logInteraction(type, metadata = {}) {
    console.log(`📊 ${type}:`, metadata);

    // In production, send to analytics service
    if (window.APP_CONFIG?.ENVIRONMENT === "production") {
      // Send to analytics endpoint
    }
  }

  // UTILITY METHODS
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // PUBLIC METHODS
  async clearChat() {
    const messagesContainer = document.getElementById("messagesContainer");
    if (messagesContainer) {
      messagesContainer.innerHTML = "";
    }

    // Clear conversation context
    this.conversationContext = [];

    try {
      await clearChatFromFirebase(this.conversationId);
      // Add new welcome message
      await this.addMessage(
        "ai",
        "Hello! I'm your AI customer support assistant. How can I help you today? 😊"
      );

      this.showNotification("Chat cleared successfully", "success");
      return true;
    } catch (error) {
      console.error("Error clearing chat:", error);
      return false;
    }
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

// Initialize Chat Manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.chatManager = new ChatManager();

  // Make clearChat available globally
  window.clearChat = () => window.chatManager.clearChat();
});

// Utility function for array checks
function any(condition) {
  return condition;
}
