// AI Customer Service Platform - Enhanced with Creative Tab Selection

document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const chatContainer = document.getElementById("chatContainer");
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  const clearChatButton = document.getElementById("clearChat");
  const themeToggle = document.getElementById("themeToggle");
  const welcomeCard = document.getElementById("welcomeCard");
  const inputQuestionTabs = document.getElementById("inputQuestionTabs");
  const uploadBtn = document.getElementById("uploadBtn");

  // State
  let isDarkMode = false;
  let chatHistory = [];
  let currentUser = null;
  let selectedTab = null;

  // Initialize the chat
  initializeChat();

  // Event Listeners
  sendButton.addEventListener("click", sendMessage);
  messageInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Input focus/blur events for question tabs
  messageInput.addEventListener("focus", showInputQuestionTabs);
  messageInput.addEventListener("blur", function () {
    setTimeout(hideInputQuestionTabs, 200);
  });

  clearChatButton.addEventListener("click", clearChat);
  themeToggle.addEventListener("click", toggleTheme);
  uploadBtn.addEventListener("click", openUploadModal);

  // Enhanced Question tabs functionality with selection states
  const questionTabs = document.querySelectorAll(
    ".question-tab, .quick-question-tab"
  );

  questionTabs.forEach((tab) => {
    tab.addEventListener("click", function (e) {
      // Create ripple effect
      createRippleEffect(e, this);

      // Remove selection from all tabs
      removeAllSelections();

      // Add selected class to clicked tab
      this.classList.add("selected");
      selectedTab = this;

      // Store selection in session storage
      const category = this.getAttribute("data-category");
      sessionStorage.setItem("selectedTab", category);

      if (this.id === "uploadDocBtn") {
        openUploadModal();
      } else {
        const question = this.getAttribute("data-question");
        if (question) {
          messageInput.value = question;
          hideInputQuestionTabs();

          // Hide welcome card after clicking a question
          if (welcomeCard && welcomeCard.style.display !== "none") {
            welcomeCard.style.display = "none";
          }

          // Auto-focus input and prepare for sending
          messageInput.focus();
        }
      }
    });
  });

  // Auto-resize textarea
  messageInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";

    // Hide question tabs when user starts typing
    if (this.value.trim() !== "") {
      hideInputQuestionTabs();
      removeAllSelections();
    } else {
      showInputQuestionTabs();
    }
  });

  // Functions
  async function initializeChat() {
    // Initialize user
    currentUser = localStorage.getItem("userId") || generateUserId();
    localStorage.setItem("userId", currentUser);

    // Load chat history from localStorage
    const localHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
    chatHistory = localHistory;

    if (localHistory.length > 0) {
      welcomeCard.style.display = "none";
      localHistory.forEach((message) => {
        addMessageToChat(message.text, message.sender, false);
      });
    }

    // Apply saved theme
    if (localStorage.getItem("darkMode") === "true") {
      enableDarkMode();
    }

    // Initialize input question tabs state
    hideInputQuestionTabs();

    // Restore selected tab from session storage
    const savedTab = sessionStorage.getItem("selectedTab");
    if (savedTab) {
      const tabToSelect = document.querySelector(
        `[data-category="${savedTab}"]`
      );
      if (tabToSelect) {
        tabToSelect.classList.add("selected");
        selectedTab = tabToSelect;
      }
    }
  }

  function generateUserId() {
    return "user-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
  }

  async function sendMessage() {
    const message = messageInput.value.trim();

    if (message === "") return;

    // Add user message to chat
    await addMessageToChat(message, "user");

    // Clear input and reset height
    messageInput.value = "";
    messageInput.style.height = "auto";

    // Hide welcome card after first message
    if (welcomeCard && welcomeCard.style.display !== "none") {
      welcomeCard.style.display = "none";
    }

    // Hide question tabs and remove selection after sending
    hideInputQuestionTabs();
    removeAllSelections();

    // Simulate AI response (replace with actual API call)
    simulateAIResponse(message);
  }

  async function addMessageToChat(message, sender, saveToHistory = true) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", "flex", "items-end", "space-x-2");

    if (sender === "user") {
      messageElement.classList.add("justify-end");
      messageElement.innerHTML = `
                <div class="user-message px-4 py-3 max-w-xs md:max-w-md">
                    ${message}
                </div>
                <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-user text-white text-xs"></i>
                </div>
            `;
    } else {
      messageElement.classList.add("justify-start");
      messageElement.innerHTML = `
                <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-robot text-white text-xs"></i>
                </div>
                <div class="bot-message px-4 py-3 max-w-xs md:max-w-md">
                    ${message}
                </div>
            `;
    }

    chatContainer.appendChild(messageElement);
    scrollToBottom();

    // Save to chat history
    if (saveToHistory) {
      const messageData = {
        text: message,
        sender: sender,
        timestamp: new Date().toISOString(),
      };

      chatHistory.push(messageData);
      localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    }
  }

  // Input Question Tabs Functions
  function showInputQuestionTabs() {
    if (messageInput.value.trim() === "") {
      inputQuestionTabs.classList.remove("hidden");
    }
  }

  function hideInputQuestionTabs() {
    inputQuestionTabs.classList.add("hidden");
  }

  // Selection Management Functions
  function removeAllSelections() {
    questionTabs.forEach((tab) => {
      tab.classList.remove("selected");
    });
    selectedTab = null;
    sessionStorage.removeItem("selectedTab");
  }

  // Ripple Effect Function
  function createRippleEffect(event, element) {
    const ripple = document.createElement("span");
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    ripple.classList.add("ripple");

    element.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  async function clearChat() {
    if (
      confirm(
        "Are you sure you want to clear the chat history? This cannot be undone."
      )
    ) {
      chatContainer.innerHTML = "";
      chatHistory = [];
      localStorage.removeItem("chatHistory");
      removeAllSelections();

      // Show welcome card again
      if (welcomeCard) {
        welcomeCard.style.display = "block";
      }

      // Add new welcome message
      addMessageToChat(
        "Hello! I'm your AI customer service assistant. How can I help you today?",
        "bot",
        false
      );

      // Reset input question tabs
      hideInputQuestionTabs();
    }
  }

  function toggleTheme() {
    if (isDarkMode) {
      disableDarkMode();
    } else {
      enableDarkMode();
    }
  }

  function enableDarkMode() {
    document.body.classList.add("dark-mode");
    themeToggle.innerHTML = '<i class="fas fa-sun text-yellow-400"></i>';
    isDarkMode = true;
    localStorage.setItem("darkMode", "true");
  }

  function disableDarkMode() {
    document.body.classList.remove("dark-mode");
    themeToggle.innerHTML = '<i class="fas fa-moon text-gray-600"></i>';
    isDarkMode = false;
    localStorage.setItem("darkMode", "false");
  }

  function openUploadModal() {
    alert("Upload modal would open here. This is a demo feature.");
  }

  // Simulate AI Response (Replace with actual API call)
  function simulateAIResponse(userMessage) {
    const responses = {
      "What are your business hours?":
        "Our business hours are Monday to Friday, 9:00 AM to 6:00 PM EST. We're also available on Saturdays from 10:00 AM to 2:00 PM EST.",
      "Do you offer technical support?":
        "Yes! We offer 24/7 technical support for all our products. You can reach our support team via phone, email, or live chat.",
      "What services do you provide?":
        "We provide a wide range of services including web development, mobile app development, cloud solutions, AI integration, and ongoing technical support.",
      "How can I contact customer service?":
        "You can contact our customer service team at support@company.com or call us at 1-800-123-4567. We're here to help 24/7!",
      "What is your refund policy?":
        "We offer a 30-day money-back guarantee on all our services. If you're not satisfied, contact our support team for a full refund.",
    };

    const response =
      responses[userMessage] ||
      "Thank you for your question! I'll help you with that. Our team is dedicated to providing the best service possible.";

    // Simulate typing delay
    setTimeout(() => {
      addMessageToChat(response, "bot");
    }, 1000 + Math.random() * 1000);
  }
});
