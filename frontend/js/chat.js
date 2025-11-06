// chat.js - Fixed chat functionality
class ChatApp {
  constructor() {
    this.config = window.APP_CONFIG || {
      API_BASE_URL: "https://ai-customer-service-backend.onrender.com",
    };
    this.isInitialized = false;
    this.init();
  }

  init() {
    if (this.isInitialized) return;

    console.log("🚀 Initializing ChatApp...");
    this.setupEventListeners();
    this.isInitialized = true;

    // Test backend connection
    this.testBackendConnection();
  }

  setupEventListeners() {
    // Wait for DOM to be fully loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.bindEvents());
    } else {
      this.bindEvents();
    }
  }

  bindEvents() {
    console.log("🔧 Binding chat events...");

    // Try multiple selectors for chat input
    const inputSelectors = [
      'input[type="text"]',
      "textarea",
      "#message-input",
      ".message-input",
      '[id*="message"]',
      '[class*="message"]',
      '[placeholder*="message"]',
      '[placeholder*="type"]',
    ];

    let chatInput = null;
    let sendButton = null;

    // Find chat input
    for (const selector of inputSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        chatInput = element;
        console.log(`✅ Found chat input: ${selector}`);
        break;
      }
    }

    // Find send button
    const buttonSelectors = [
      'button[type="submit"]',
      ".send-button",
      "#send-button",
      '[class*="send"]',
      '[class*="submit"]',
      "button:last-child",
    ];

    for (const selector of buttonSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        sendButton = element;
        console.log(`✅ Found send button: ${selector}`);
        break;
      }
    }

    // Bind events
    if (chatInput && sendButton) {
      sendButton.addEventListener("click", () =>
        this.handleSendMessage(chatInput)
      );
      chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.handleSendMessage(chatInput);
        }
      });
      console.log("✅ Chat events bound successfully");
    } else {
      console.error("❌ Could not find chat input elements");
      console.log(
        "Available inputs:",
        document.querySelectorAll("input, textarea")
      );
      console.log("Available buttons:", document.querySelectorAll("button"));
    }

    // Also bind quick question buttons
    this.bindQuickQuestions();
  }

  bindQuickQuestions() {
    const quickQuestions = document.querySelectorAll(
      'button, .question, [class*="question"]'
    );
    quickQuestions.forEach((button) => {
      if (button.textContent && button.textContent.length < 100) {
        button.addEventListener("click", () => {
          this.sendMessage(button.textContent.trim());
        });
      }
    });
  }

  handleSendMessage(chatInput) {
    const message = chatInput.value.trim();
    if (!message) return;

    console.log(`📨 Sending message: "${message}"`);
    this.sendMessage(message);
    chatInput.value = ""; // Clear input
  }

  async sendMessage(message) {
    if (!message || message.trim() === "") return;

    // Show typing indicator
    this.showTypingIndicator();

    try {
      console.log(`🔄 Calling backend: ${this.config.API_BASE_URL}/chat`);

      const response = await fetch(`${this.config.API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          user_id: "user_" + Math.random().toString(36).substr(2, 9),
        }),
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Response received:", data);

      // Hide typing indicator
      this.hideTypingIndicator();

      // Display response
      this.displayMessage(
        "assistant",
        data.response || data.message || "No response received"
      );
    } catch (error) {
      console.error("❌ Chat error:", error);
      this.hideTypingIndicator();
      this.displayMessage(
        "assistant",
        "I apologize, but I'm having trouble processing your request right now. Please try again in a moment."
      );
    }
  }

  showTypingIndicator() {
    this.hideTypingIndicator(); // Remove existing first

    const indicator = document.createElement("div");
    indicator.id = "typing-indicator";
    indicator.className = "message ai-response typing";
    indicator.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <em>AI is typing...</em>
        `;

    this.getMessageContainer().appendChild(indicator);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) {
      indicator.remove();
    }
  }

  displayMessage(sender, content) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${
      sender === "user" ? "user-message" : "ai-response"
    }`;

    messageDiv.innerHTML = `
            <div class="message-bubble ${
              sender === "user" ? "user-bubble" : "ai-bubble"
            }">
                ${content}
            </div>
        `;

    this.getMessageContainer().appendChild(messageDiv);
    this.scrollToBottom();
  }

  getMessageContainer() {
    let container = document.getElementById("chat-messages");

    if (!container) {
      container = document.createElement("div");
      container.id = "chat-messages";
      container.className = "chat-messages";
      container.style.cssText = `
                height: 400px;
                overflow-y: auto;
                border: 1px solid #e0e0e0;
                border-radius: 10px;
                padding: 15px;
                margin: 20px 0;
                background: #fafafa;
            `;

      // Try to find a good place to insert the chat
      const chatSection =
        document.querySelector("h3, h4, .quick-questions") ||
        document.querySelector("main") ||
        document.body;
      chatSection.appendChild(container);
    }

    return container;
  }

  scrollToBottom() {
    const container = this.getMessageContainer();
    container.scrollTop = container.scrollHeight;
  }

  async testBackendConnection() {
    try {
      console.log("🔍 Testing backend connection...");
      const response = await fetch(`${this.config.API_BASE_URL}/health`);
      const data = await response.json();
      console.log("✅ Backend connection test:", data);
    } catch (error) {
      console.error("❌ Backend connection test failed:", error);
    }
  }
}

// Add CSS for typing indicator
const chatStyles = `
    .typing-dots {
        display: inline-block;
        margin-right: 10px;
    }
    .typing-dots span {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #666;
        margin: 0 2px;
        animation: typing 1.4s infinite ease-in-out;
    }
    .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
    @keyframes typing {
        0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
    }
    .message-bubble {
        padding: 12px 16px;
        border-radius: 18px;
        margin: 5px 0;
        max-width: 80%;
        word-wrap: break-word;
    }
    .user-bubble {
        background: #007bff;
        color: white;
        margin-left: auto;
    }
    .ai-bubble {
        background: #f1f1f1;
        color: #333;
        margin-right: auto;
    }
    .typing {
        opacity: 0.7;
        font-style: italic;
    }
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.textContent = chatStyles;
document.head.appendChild(styleSheet);

// Initialize chat when page loads
document.addEventListener("DOMContentLoaded", () => {
  window.chatApp = new ChatApp();
});

// Manual test function
window.testChat = function (message = "Hello, are you working?") {
  if (!window.chatApp) {
    window.chatApp = new ChatApp();
  }
  window.chatApp.sendMessage(message);
};

console.log("🔧 chat.js loaded - ChatApp class available");
