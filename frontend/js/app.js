// AI Customer Service Platform - Frontend JavaScript with File Upload

document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const chatContainer = document.getElementById("chatContainer");
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  const clearChatButton = document.getElementById("clearChat");
  const themeToggle = document.getElementById("themeToggle");
  const typingIndicator = document.getElementById("typingIndicator");
  const welcomeCard = document.getElementById("welcomeCard");

  // File Upload Elements
  const uploadBtn = document.getElementById("uploadBtn");
  const uploadModal = document.getElementById("uploadModal");
  const closeModal = document.getElementById("closeModal");
  const cancelUpload = document.getElementById("cancelUpload");
  const fileInput = document.getElementById("fileInput");
  const browseBtn = document.getElementById("browseBtn");
  const fileInfo = document.getElementById("fileInfo");
  const fileName = document.getElementById("fileName");
  const fileSize = document.getElementById("fileSize");
  const removeFile = document.getElementById("removeFile");
  const confirmUpload = document.getElementById("confirmUpload");
  const uploadProgress = document.getElementById("uploadProgress");
  const progressBar = document.getElementById("progressBar");
  const progressPercent = document.getElementById("progressPercent");
  const uploadResult = document.getElementById("uploadResult");

  // Knowledge Stats Elements
  const totalChunks = document.getElementById("totalChunks");
  const baseChunks = document.getElementById("baseChunks");
  const uploadedDocs = document.getElementById("uploadedDocs");
  const totalDocs = document.getElementById("totalDocs");

  // State
  let isDarkMode = false;
  let chatHistory = [];
  let currentUser = null;
  let selectedFile = null;

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

  clearChatButton.addEventListener("click", clearChat);
  themeToggle.addEventListener("click", toggleTheme);

  // File Upload Event Listeners
  uploadBtn.addEventListener("click", openUploadModal);
  closeModal.addEventListener("click", closeUploadModal);
  cancelUpload.addEventListener("click", closeUploadModal);
  browseBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileSelect);
  removeFile.addEventListener("click", removeSelectedFile);
  confirmUpload.addEventListener("click", uploadFile);

  // Question tabs functionality
  const questionTabs = document.querySelectorAll(".question-tab");

  questionTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Add click animation
      this.style.transform = "scale(0.95)";
      setTimeout(() => {
        this.style.transform = "";
      }, 150);

      if (this.id === "uploadDocBtn") {
        openUploadModal();
      } else {
        const question = this.getAttribute("data-question");
        messageInput.value = question;
        sendMessage();

        // Hide welcome card after clicking a question
        if (welcomeCard) {
          welcomeCard.style.display = "none";
        }
      }
    });
  });

  // Auto-resize textarea
  messageInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });

  // Functions
  async function initializeChat() {
    // Initialize user
    currentUser = localStorage.getItem("userId") || generateUserId();
    localStorage.setItem("userId", currentUser);

    // Load chat history from localStorage
    const localHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
    chatHistory = localHistory;

    // Load knowledge stats
    await loadKnowledgeStats();

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
  }

  function generateUserId() {
    return "user-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
  }

  async function loadKnowledgeStats() {
    try {
      const API_BASE_URL =
        "https://ai-customer-service-backend-rthi.onrender.com";
      const response = await fetch(`${API_BASE_URL}/api/knowledge/stats`);
      if (response.ok) {
        const stats = await response.json();
        updateStatsDisplay(stats);
      }
    } catch (error) {
      console.error("Error loading knowledge stats:", error);
    }
  }

  function updateStatsDisplay(stats) {
    totalChunks.textContent = stats.total_chunks;
    baseChunks.textContent = stats.base_knowledge_chunks;
    uploadedDocs.textContent = stats.uploaded_documents;
    totalDocs.textContent = stats.total_chunks;
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
    if (welcomeCard.style.display !== "none") {
      welcomeCard.style.display = "none";
    }

    // Show typing indicator
    showTypingIndicator();

    try {
      // Get AI response from backend
      const botResponse = await sendMessageToAPI(message);
      hideTypingIndicator();
      await addMessageToChat(botResponse, "bot");
    } catch (error) {
      hideTypingIndicator();
      console.error("Error getting AI response:", error);
      const fallbackResponse =
        "I'm having trouble connecting right now. Please try again in a moment.";
      await addMessageToChat(fallbackResponse, "bot");
    }
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

  // File Upload Functions
  function openUploadModal() {
    uploadModal.classList.remove("hidden");
    resetUploadForm();
  }

  function closeUploadModal() {
    uploadModal.classList.add("hidden");
    resetUploadForm();
  }

  function resetUploadForm() {
    selectedFile = null;
    fileInput.value = "";
    fileInfo.classList.add("hidden");
    confirmUpload.disabled = true;
    uploadProgress.classList.add("hidden");
    uploadResult.classList.add("hidden");
    progressBar.style.width = "0%";
    progressPercent.textContent = "0%";
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      const validTypes = [".pdf", ".docx", ".txt"];
      const fileExtension = "." + file.name.split(".").pop().toLowerCase();

      if (!validTypes.includes(fileExtension)) {
        showUploadResult("Please select a PDF, DOCX, or TXT file.", "error");
        return;
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        showUploadResult("File size must be less than 10MB.", "error");
        return;
      }

      selectedFile = file;
      updateFileInfo(file);
    }
  }

  function updateFileInfo(file) {
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.classList.remove("hidden");
    confirmUpload.disabled = false;
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function removeSelectedFile() {
    selectedFile = null;
    fileInput.value = "";
    fileInfo.classList.add("hidden");
    confirmUpload.disabled = true;
  }

  async function uploadFile() {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    // Use environment-specific API URL
    const API_BASE_URL =
      "https://ai-customer-service-backend-rthi.onrender.com";

    // Show progress
    uploadProgress.classList.remove("hidden");
    confirmUpload.disabled = true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      // Simulate progress
      simulateUploadProgress();

      const result = await response.json();

      if (response.ok) {
        showUploadResult(`✅ ${result.message}`, "success");
        await loadKnowledgeStats();

        setTimeout(() => {
          closeUploadModal();
        }, 2000);
      } else {
        showUploadResult(`❌ ${result.error}`, "error");
        confirmUpload.disabled = false;
      }
    } catch (error) {
      console.error("Upload error:", error);
      showUploadResult("❌ Upload failed. Please try again.", "error");
      confirmUpload.disabled = false;
    }
  }

  function simulateUploadProgress() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 90) {
        clearInterval(interval);
      } else {
        progressBar.style.width = progress + "%";
        progressPercent.textContent = Math.round(progress) + "%";
      }
    }, 200);
  }

  function showUploadResult(message, type) {
    uploadResult.textContent = message;
    uploadResult.className = "mt-4 p-3 rounded-lg ";

    if (type === "success") {
      uploadResult.classList.add(
        "bg-green-100",
        "text-green-800",
        "border",
        "border-green-200"
      );
    } else {
      uploadResult.classList.add(
        "bg-red-100",
        "text-red-800",
        "border",
        "border-red-200"
      );
    }

    uploadResult.classList.remove("hidden");
  }

  function showTypingIndicator() {
    typingIndicator.classList.remove("hidden");
    scrollToBottom();
  }

  function hideTypingIndicator() {
    typingIndicator.classList.add("hidden");
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
      welcomeCard.style.display = "block";

      // Add new welcome message
      addMessageToChat(
        "Hello! I'm your AI customer service assistant. How can I help you today?",
        "bot",
        false
      );
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

  // API Integration Function
  async function sendMessageToAPI(message) {
    try {
      // Use environment-specific API URL
      const API_BASE_URL =
        "https://ai-customer-service-backend-rthi.onrender.com";

      console.log("Sending message to backend API:", message);

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          userId: currentUser,
          conversationContext: chatHistory.slice(-4),
        }),
      });

      console.log("API Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response data:", data);

      if (data.status === "success") {
        return data.response;
      } else {
        throw new Error(data.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Error sending message to API:", error);
      throw error;
    }
  }
});
