// Minimal Working AI Chat - Guaranteed to Work
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Starting AI Chat...");

  // Initialize with minimal setup
  const aiChat = new AIChat();
  window.aiChat = aiChat;
});

class AIChat {
  constructor() {
    this.init();
  }

  init() {
    console.log("🔧 Initializing chat...");

    // Find elements with more flexible selectors
    this.findElements();
    this.setupEventListeners();
    this.loadHistory();

    console.log("✅ Chat ready!");
  }

  findElements() {
    console.log("🔍 Finding elements...");

    // Core elements - try multiple selectors
    this.chatContainer =
      document.getElementById("chatContainer") ||
      document.querySelector('[id*="chat"]') ||
      document.querySelector(".overflow-y-auto");

    this.messageInput =
      document.getElementById("messageInput") ||
      document.querySelector("textarea") ||
      document.querySelector('[placeholder*="message"]');

    this.sendButton =
      document.getElementById("sendButton") ||
      document.querySelector('button[onclick*="send"]') ||
      document.querySelector("button:has(.fa-paper-plane)") ||
      document.querySelector("button:last-child");

    // Welcome card
    this.welcomeCard =
      document.getElementById("welcomeCard") ||
      document.querySelector(".text-center");

    console.log("Elements found:", {
      chatContainer: !!this.chatContainer,
      messageInput: !!this.messageInput,
      sendButton: !!this.sendButton,
      welcomeCard: !!this.welcomeCard,
    });

    // Create elements if they don't exist (fallback)
    this.createFallbackElements();
  }

  createFallbackElements() {
    // Ensure we have a chat container
    if (!this.chatContainer) {
      this.chatContainer = document.createElement("div");
      this.chatContainer.id = "chatContainer";
      this.chatContainer.className = "h-96 overflow-y-auto p-6 space-y-4";
      document.querySelector(".bg-white")?.appendChild(this.chatContainer);
    }

    // Ensure we have input area
    if (!this.messageInput || !this.sendButton) {
      this.createInputArea();
    }
  }

  createInputArea() {
    const inputArea = document.createElement("div");
    inputArea.className = "border-t border-gray-200 p-6";
    inputArea.innerHTML = `
            <div class="flex space-x-4">
                <div class="flex-1 relative">
                    <textarea 
                        id="messageInput" 
                        placeholder="Type your message here..." 
                        rows="1"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    ></textarea>
                    <button 
                        id="sendButton"
                        class="absolute right-3 bottom-3 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                    >
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

    document.querySelector(".bg-white")?.appendChild(inputArea);

    // Re-find elements
    this.messageInput = document.getElementById("messageInput");
    this.sendButton = document.getElementById("sendButton");
  }

  setupEventListeners() {
    console.log("🎯 Setting up event listeners...");

    if (this.sendButton && this.messageInput) {
      this.sendButton.addEventListener("click", () => this.sendMessage());

      this.messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Auto-resize
      this.messageInput.addEventListener("input", () => {
        this.messageInput.style.height = "auto";
        this.messageInput.style.height = this.messageInput.scrollHeight + "px";
      });

      console.log("✅ Event listeners set up");
    } else {
      console.error("❌ Cannot set up event listeners - elements missing");
    }

    // Setup question tabs
    this.setupQuestionTabs();
  }

  setupQuestionTabs() {
    const questionTabs = document.querySelectorAll(
      ".question-tab, [data-question]"
    );
    questionTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const question = tab.getAttribute("data-question");
        if (question && this.messageInput) {
          this.messageInput.value = question;
          this.sendMessage();
        }
      });
    });
  }

  async sendMessage() {
    const message = this.messageInput?.value?.trim();

    if (!message) {
      this.showMessage("Please enter a message", "warning");
      return;
    }

    console.log("💬 Sending:", message);

    // Add user message
    this.addMessage(message, "user");

    // Clear input
    if (this.messageInput) {
      this.messageInput.value = "";
      this.messageInput.style.height = "auto";
    }

    // Hide welcome
    if (this.welcomeCard) {
      this.welcomeCard.style.display = "none";
    }

    // Show typing
    this.showTyping();

    // Get response
    setTimeout(() => {
      this.hideTyping();
      const response = this.generateResponse(message);
      this.addMessage(response, "bot");
    }, 1000 + Math.random() * 1000);
  }

  addMessage(text, sender) {
    if (!this.chatContainer) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `flex items-end space-x-2 ${
      sender === "user" ? "justify-end" : "justify-start"
    }`;

    if (sender === "user") {
      messageDiv.innerHTML = `
                <div class="bg-blue-500 text-white px-4 py-3 rounded-lg max-w-xs md:max-w-md">
                    ${this.escapeHtml(text)}
                </div>
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-user text-white text-xs"></i>
                </div>
            `;
    } else {
      messageDiv.innerHTML = `
                <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-robot text-white text-xs"></i>
                </div>
                <div class="bg-gray-100 text-gray-800 px-4 py-3 rounded-lg max-w-xs md:max-w-md">
                    ${this.escapeHtml(text)}
                </div>
            `;
    }

    this.chatContainer.appendChild(messageDiv);
    this.scrollToBottom();

    // Save to history
    this.saveToHistory(text, sender);
  }

  generateResponse(message) {
    const lowerMessage = message.toLowerCase();

    const responses = {
      hello: "Hello! How can I help you today?",
      hi: "Hi there! What can I help you with?",
      help: "I can help you with:\n• Answering questions\n• Providing information\n• Analyzing documents\n\nWhat do you need help with?",
      thank: "You're welcome! Is there anything else I can help you with?",
      bye: "Goodbye! Feel free to come back if you have more questions.",
      hours: "Our business hours are Monday-Friday, 9AM-6PM EST.",
      contact:
        "You can contact us at:\n• Phone: 1-800-123-4567\n• Email: support@company.com\n• Live Chat: Available 24/7",
      pricing:
        "We offer various pricing plans:\n• Basic: $29/month\n• Pro: $79/month\n• Enterprise: Custom pricing\n\nWhich plan are you interested in?",
      support:
        "Our technical support team is available 24/7. You can reach them via phone, email, or live chat in the help section.",
    };

    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }

    return `I understand you're asking about "${message}". I'm an AI assistant trained to help with customer service inquiries. Could you provide more details about what you need help with?`;
  }

  showTyping() {
    if (!this.chatContainer) return;

    const typingDiv = document.createElement("div");
    typingDiv.id = "typingIndicator";
    typingDiv.className = "flex items-center space-x-2 justify-start";
    typingDiv.innerHTML = `
            <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-robot text-white text-xs"></i>
            </div>
            <div class="bg-gray-100 text-gray-800 px-4 py-3 rounded-lg">
                <div class="flex space-x-1">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                </div>
            </div>
        `;

    this.chatContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }

  hideTyping() {
    const typingIndicator = document.getElementById("typingIndicator");
    if (typingIndicator) {
      typingIndicator.remove();
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

  showMessage(text, type = "info") {
    console.log(`📢 ${type}: ${text}`);
    alert(text); // Simple fallback
  }

  loadHistory() {
    try {
      const saved = localStorage.getItem("chatHistory");
      if (saved) {
        const history = JSON.parse(saved);
        history.forEach((msg) => this.addMessage(msg.text, msg.sender));

        if (history.length > 0 && this.welcomeCard) {
          this.welcomeCard.style.display = "none";
        }
      }
    } catch (e) {
      console.warn("Failed to load history:", e);
    }
  }

  saveToHistory(text, sender) {
    try {
      const history = JSON.parse(localStorage.getItem("chatHistory") || "[]");
      history.push({ text, sender, timestamp: new Date().toISOString() });

      // Keep last 50 messages
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }

      localStorage.setItem("chatHistory", JSON.stringify(history));
    } catch (e) {
      console.warn("Failed to save history:", e);
    }
  }
}

// Fallback: If DOM is already loaded
if (
  document.readyState === "interactive" ||
  document.readyState === "complete"
) {
  console.log("📄 DOM already loaded, starting chat...");
  window.aiChat = new AIChat();
}
