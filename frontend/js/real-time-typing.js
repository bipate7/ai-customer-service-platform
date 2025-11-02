// js/real-time-typing.js - Real-time Typing Indicators for Phase 7

class RealTimeTyping {
  constructor() {
    this.isTyping = false;
    this.typingSpeed = window.APP_CONFIG?.PERFORMANCE?.TYPING_SPEED || 30; // ms per character
    this.typingElements = new Map();
    this.currentTypingIndicator = null;
  }

  /**
   * Show enhanced typing indicator with different states
   */
  showTypingIndicator(messageType = "thinking") {
    const typingIndicator = document.getElementById("typingIndicator");
    if (!typingIndicator) return;

    const typingText = typingIndicator.querySelector(".typing-text");
    const typingSubtext = typingIndicator.querySelector(".typing-subtext");

    const messages = {
      thinking: {
        main: "AI Assistant is thinking...",
        sub: "Analyzing your question",
      },
      searching: {
        main: "Searching knowledge base...",
        sub: "Looking through documents and resources",
      },
      analyzing: {
        main: "Analyzing your question...",
        sub: "Understanding context and intent",
      },
      writing: {
        main: "Writing response...",
        sub: "Crafting the perfect answer",
      },
      processing: {
        main: "Processing your request...",
        sub: "Working on multiple tasks",
      },
    };

    const currentMessage = messages[messageType] || messages.thinking;

    if (typingText) typingText.textContent = currentMessage.main;
    if (typingSubtext) typingSubtext.textContent = currentMessage.sub;

    typingIndicator.classList.remove("hidden");
    this.isTyping = true;
    this.currentTypingIndicator = typingIndicator;

    // Add subtle animation
    typingIndicator.style.animation = "slideInUp 0.3s ease-out";

    // Update typing dots animation based on type
    this.updateTypingAnimation(messageType);
  }

  /**
   * Hide typing indicator with smooth transition
   */
  hideTypingIndicator() {
    if (!this.currentTypingIndicator) return;

    const typingIndicator = this.currentTypingIndicator;
    typingIndicator.style.animation = "slideOutDown 0.3s ease-in";

    setTimeout(() => {
      typingIndicator.classList.add("hidden");
      typingIndicator.style.animation = "";
      this.isTyping = false;
      this.currentTypingIndicator = null;
    }, 300);
  }

  /**
   * Update typing animation based on message type
   */
  updateTypingAnimation(messageType) {
    const dotsContainer = document.querySelector(".typing-dots");
    if (!dotsContainer) return;

    // Clear existing dots
    dotsContainer.innerHTML = "";

    const dotCount = messageType === "processing" ? 4 : 3;
    const dotSize = messageType === "searching" ? "w-2 h-2" : "w-1.5 h-1.5";

    for (let i = 0; i < dotCount; i++) {
      const dot = document.createElement("div");
      dot.className = `typing-dot ${dotSize} bg-blue-500 rounded-full`;
      dot.style.animationDelay = `${i * 0.15}s`;
      dotsContainer.appendChild(dot);
    }
  }

  /**
   * Simulate real-time typing effect for messages
   */
  async typeMessage(message, element, speed = this.typingSpeed) {
    if (!element) return;

    this.isTyping = true;
    element.textContent = "";
    element.classList.add("streaming-response");

    // Store reference for cancellation
    this.typingElements.set(element, { isTyping: true, message });

    for (let i = 0; i < message.length; i++) {
      // Check if typing was cancelled
      if (!this.typingElements.get(element)?.isTyping) {
        break;
      }

      const char = message[i];
      element.textContent += char;

      // Random slight variations for natural feel
      const variation = speed + (Math.random() * 20 - 10);
      await this.delay(variation);

      // Occasionally pause for "thinking" effect
      if (this.shouldPause(i, message)) {
        await this.delay(200 + Math.random() * 300);
      }

      // Auto-scroll if element is visible
      if (this.isElementVisible(element)) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }

    // Clean up
    element.classList.remove("streaming-response");
    this.typingElements.delete(element);
    this.isTyping = false;
  }

  /**
   * Determine if we should pause during typing for natural effect
   */
  shouldPause(currentIndex, message) {
    // Pause after sentences
    if (currentIndex > 0 && /[.!?]/.test(message[currentIndex - 1])) {
      return Math.random() > 0.3;
    }

    // Pause after commas
    if (currentIndex > 0 && message[currentIndex - 1] === ",") {
      return Math.random() > 0.7;
    }

    // Occasional random pause
    if (currentIndex > 0 && currentIndex % 40 === 0) {
      return Math.random() > 0.5;
    }

    return false;
  }

  /**
   * Progressive response streaming simulation
   */
  async streamResponse(message, onChunk, onComplete) {
    const words = message.split(" ");
    let currentText = "";

    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? "" : " ") + words[i];

      // Call chunk callback
      if (onChunk) {
        onChunk(currentText, words[i]);
      }

      // Vary delay based on punctuation and word length
      let delay = this.calculateWordDelay(words[i]);
      await this.delay(delay);
    }

    // Call completion callback
    if (onComplete) {
      onComplete();
    }
  }

  /**
   * Calculate typing delay for a word
   */
  calculateWordDelay(word) {
    let delay = 50 + word.length * 3;

    // Longer delay for punctuation
    if (word.endsWith(".") || word.endsWith("!") || word.endsWith("?")) {
      delay += 150;
    } else if (word.endsWith(",")) {
      delay += 80;
    }

    // Random variation
    delay += Math.random() * 30;

    return delay;
  }

  /**
   * Cancel typing for a specific element
   */
  cancelTyping(element) {
    if (this.typingElements.has(element)) {
      this.typingElements.get(element).isTyping = false;
      if (element.classList.contains("streaming-response")) {
        element.classList.remove("streaming-response");
      }
    }
  }

  /**
   * Cancel all ongoing typing
   */
  cancelAllTyping() {
    this.typingElements.forEach((value, element) => {
      value.isTyping = false;
      if (element.classList.contains("streaming-response")) {
        element.classList.remove("streaming-response");
      }
    });
    this.typingElements.clear();
  }

  /**
   * Check if element is visible in viewport
   */
  isElementVisible(element) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Show temporary typing indicator for quick actions
   */
  showQuickTyping(duration = 1000) {
    this.showTypingIndicator("processing");
    setTimeout(() => {
      this.hideTypingIndicator();
    }, duration);
  }

  /**
   * Delay utility function
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current typing state
   */
  getTypingState() {
    return {
      isTyping: this.isTyping,
      activeElements: this.typingElements.size,
      currentIndicator: this.currentTypingIndicator,
    };
  }
}

// Make RealTimeTyping available globally
window.RealTimeTyping = RealTimeTyping;
