// js/error-handler.js
class ErrorHandler {
  constructor() {
    this.initializeErrorHandling();
  }

  initializeErrorHandling() {
    // Global error handler
    window.addEventListener("error", (event) => {
      this.logError("Global Error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    });

    // Promise rejection handler
    window.addEventListener("unhandledrejection", (event) => {
      this.logError("Unhandled Promise Rejection", {
        reason: event.reason,
        promise: event.promise,
      });
    });
  }

  logError(type, data) {
    const errorData = {
      type,
      ...data,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    console.error(`[${type}]`, errorData);

    // Send to backend logging service in production
    if (window.appConfig?.isProduction()) {
      this.sendToLoggingService(errorData).catch(console.error);
    }
  }

  async sendToLoggingService(data) {
    try {
      await fetch(`${window.appConfig.getAPIEndpoint("/api/logs")}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.warn("Logging service unavailable:", error);
    }
  }
}

window.ErrorHandler = ErrorHandler;
