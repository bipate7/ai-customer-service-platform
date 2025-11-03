// js/analytics-dashboard.js - Advanced Analytics for Phase 8

class AnalyticsDashboard {
  constructor() {
    this.analyticsData = this.loadAnalyticsData();
    this.charts = new Map();
    this.isVisible = false;
    this.init();
  }

  init() {
    this.createDashboard();
    this.setupEventListeners();
    this.startPeriodicUpdates();
  }

  createDashboard() {
    const dashboardHTML = `
            <div id="analyticsDashboard" class="analytics-dashboard hidden">
                <div class="dashboard-header">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-bold text-slate-800">Analytics Dashboard</h2>
                        <button id="closeDashboard" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <i class="fas fa-times text-slate-600"></i>
                        </button>
                    </div>
                    <p class="text-slate-600 text-sm mt-1">Real-time insights and performance metrics</p>
                </div>

                <div class="dashboard-content">
                    <!-- Key Metrics Overview -->
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <div class="metric-value">${
                              this.analyticsData.totalMessages || 0
                            }</div>
                            <div class="metric-label">Total Messages</div>
                            <div class="metric-trend positive">
                                <i class="fas fa-arrow-up"></i>
                                <span>12%</span>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${
                              this.analyticsData.avgResponseTime || 0
                            }ms</div>
                            <div class="metric-label">Avg Response Time</div>
                            <div class="metric-trend negative">
                                <i class="fas fa-arrow-down"></i>
                                <span>5%</span>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${
                              this.analyticsData.userSatisfaction || 0
                            }%</div>
                            <div class="metric-label">User Satisfaction</div>
                            <div class="metric-trend positive">
                                <i class="fas fa-arrow-up"></i>
                                <span>8%</span>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${
                              this.analyticsData.activeUsers || 0
                            }</div>
                            <div class="metric-label">Active Users</div>
                            <div class="metric-trend positive">
                                <i class="fas fa-arrow-up"></i>
                                <span>15%</span>
                            </div>
                        </div>
                    </div>

                    <!-- Charts Section -->
                    <div class="charts-grid">
                        <div class="chart-container">
                            <h3 class="chart-title">Message Volume Over Time</h3>
                            <div class="chart" id="messageVolumeChart"></div>
                        </div>
                        <div class="chart-container">
                            <h3 class="chart-title">Model Usage Distribution</h3>
                            <div class="chart" id="modelUsageChart"></div>
                        </div>
                        <div class="chart-container">
                            <h3 class="chart-title">Response Time Trends</h3>
                            <div class="chart" id="responseTimeChart"></div>
                        </div>
                        <div class="chart-container">
                            <h3 class="chart-title">User Satisfaction</h3>
                            <div class="chart" id="satisfactionChart"></div>
                        </div>
                    </div>

                    <!-- Detailed Analytics -->
                    <div class="detailed-analytics">
                        <div class="analytics-section">
                            <h3 class="section-title">Top Questions</h3>
                            <div class="questions-list" id="topQuestionsList">
                                ${this.renderTopQuestions()}
                            </div>
                        </div>
                        <div class="analytics-section">
                            <h3 class="section-title">Performance Metrics</h3>
                            <div class="performance-metrics" id="performanceMetrics">
                                ${this.renderPerformanceMetrics()}
                            </div>
                        </div>
                    </div>

                    <!-- Export Controls -->
                    <div class="dashboard-footer">
                        <div class="flex justify-between items-center">
                            <div class="last-updated">
                                Last updated: <span id="lastUpdatedTime">${new Date().toLocaleTimeString()}</span>
                            </div>
                            <div class="export-controls">
                                <button id="exportCSV" class="btn-secondary">
                                    <i class="fas fa-download mr-2"></i>Export CSV
                                </button>
                                <button id="refreshAnalytics" class="btn-primary">
                                    <i class="fas fa-sync-alt mr-2"></i>Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", dashboardHTML);
  }

  setupEventListeners() {
    // Close dashboard
    document.getElementById("closeDashboard").addEventListener("click", () => {
      this.hide();
    });

    // Refresh analytics
    document
      .getElementById("refreshAnalytics")
      .addEventListener("click", () => {
        this.refreshData();
      });

    // Export CSV
    document.getElementById("exportCSV").addEventListener("click", () => {
      this.exportToCSV();
    });

    // Close on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isVisible) {
        this.hide();
      }
    });
  }

  show() {
    document.getElementById("analyticsDashboard").classList.remove("hidden");
    this.isVisible = true;
    this.initializeCharts();
    this.trackEvent("dashboard_opened");
  }

  hide() {
    document.getElementById("analyticsDashboard").classList.add("hidden");
    this.isVisible = false;
    this.trackEvent("dashboard_closed");
  }

  initializeCharts() {
    // Initialize all charts
    this.createMessageVolumeChart();
    this.createModelUsageChart();
    this.createResponseTimeChart();
    this.createSatisfactionChart();
  }

  createMessageVolumeChart() {
    const ctx = document.getElementById("messageVolumeChart").getContext("2d");
    const data = this.generateMessageVolumeData();

    this.charts.set(
      "messageVolume",
      new Chart(ctx, {
        type: "line",
        data: {
          labels: data.labels,
          datasets: [
            {
              label: "Messages",
              data: data.values,
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(0, 0, 0, 0.1)",
              },
            },
            x: {
              grid: {
                display: false,
              },
            },
          },
        },
      })
    );
  }

  createModelUsageChart() {
    const ctx = document.getElementById("modelUsageChart").getContext("2d");
    const data = this.generateModelUsageData();

    this.charts.set(
      "modelUsage",
      new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: data.labels,
          datasets: [
            {
              data: data.values,
              backgroundColor: [
                "#3b82f6",
                "#10b981",
                "#f59e0b",
                "#ef4444",
                "#8b5cf6",
              ],
              borderWidth: 2,
              borderColor: "#fff",
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "bottom",
            },
          },
        },
      })
    );
  }

  createResponseTimeChart() {
    const ctx = document.getElementById("responseTimeChart").getContext("2d");
    const data = this.generateResponseTimeData();

    this.charts.set(
      "responseTime",
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: data.labels,
          datasets: [
            {
              label: "Response Time (ms)",
              data: data.values,
              backgroundColor: "#10b981",
              borderColor: "#059669",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(0, 0, 0, 0.1)",
              },
            },
            x: {
              grid: {
                display: false,
              },
            },
          },
        },
      })
    );
  }

  createSatisfactionChart() {
    const ctx = document.getElementById("satisfactionChart").getContext("2d");
    const data = this.generateSatisfactionData();

    this.charts.set(
      "satisfaction",
      new Chart(ctx, {
        type: "line",
        data: {
          labels: data.labels,
          datasets: [
            {
              label: "Satisfaction Score",
              data: data.values,
              borderColor: "#8b5cf6",
              backgroundColor: "rgba(139, 92, 246, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              min: 0,
              max: 100,
              grid: {
                color: "rgba(0, 0, 0, 0.1)",
              },
            },
            x: {
              grid: {
                display: false,
              },
            },
          },
        },
      })
    );
  }

  generateMessageVolumeData() {
    // Generate sample data - in real app, this would come from API
    return {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      values: [65, 78, 90, 81, 86, 55, 40],
    };
  }

  generateModelUsageData() {
    return {
      labels: ["GPT-4", "GPT-3.5", "Claude", "Auto", "Other"],
      values: [45, 30, 15, 8, 2],
    };
  }

  generateResponseTimeData() {
    return {
      labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
      values: [1200, 800, 600, 900, 1100, 1300],
    };
  }

  generateSatisfactionData() {
    return {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      values: [75, 82, 78, 85, 88, 90],
    };
  }

  renderTopQuestions() {
    const questions = this.analyticsData.topQuestions || [
      { question: "What are your business hours?", count: 45 },
      { question: "How do I reset my password?", count: 32 },
      { question: "What is your pricing?", count: 28 },
      { question: "Do you offer technical support?", count: 25 },
      { question: "Where can I find documentation?", count: 22 },
    ];

    return questions
      .map(
        (q) => `
            <div class="question-item">
                <div class="question-text">${q.question}</div>
                <div class="question-count">${q.count}</div>
            </div>
        `
      )
      .join("");
  }

  renderPerformanceMetrics() {
    const metrics = this.analyticsData.performanceMetrics || {
      uptime: "99.9%",
      errorRate: "0.2%",
      avgLoadTime: "1.2s",
      peakConcurrent: "150",
    };

    return `
            <div class="metric-grid">
                <div class="metric-item">
                    <span class="metric-name">Uptime</span>
                    <span class="metric-value">${metrics.uptime}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Error Rate</span>
                    <span class="metric-value">${metrics.errorRate}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Avg Load Time</span>
                    <span class="metric-value">${metrics.avgLoadTime}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Peak Concurrent</span>
                    <span class="metric-value">${metrics.peakConcurrent}</span>
                </div>
            </div>
        `;
  }

  refreshData() {
    // Simulate data refresh
    document.getElementById("refreshAnalytics").classList.add("loading");

    setTimeout(() => {
      this.analyticsData = this.loadAnalyticsData();
      this.updateDashboard();
      document.getElementById("refreshAnalytics").classList.remove("loading");
      document.getElementById("lastUpdatedTime").textContent =
        new Date().toLocaleTimeString();
      this.trackEvent("dashboard_refreshed");
    }, 1000);
  }

  updateDashboard() {
    // Update all chart data
    this.charts.forEach((chart, key) => {
      chart.destroy();
    });
    this.charts.clear();
    this.initializeCharts();

    // Update other dashboard elements
    document.getElementById("topQuestionsList").innerHTML =
      this.renderTopQuestions();
    document.getElementById("performanceMetrics").innerHTML =
      this.renderPerformanceMetrics();
  }

  loadAnalyticsData() {
    try {
      return JSON.parse(localStorage.getItem("ai_analytics_data") || "{}");
    } catch (error) {
      console.warn("Failed to load analytics data:", error);
      return {};
    }
  }

  saveAnalyticsData() {
    try {
      localStorage.setItem(
        "ai_analytics_data",
        JSON.stringify(this.analyticsData)
      );
    } catch (error) {
      console.warn("Failed to save analytics data:", error);
    }
  }

  exportToCSV() {
    const csvData = this.generateCSVData();
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.trackEvent("analytics_exported");
  }

  generateCSVData() {
    const headers = ["Metric", "Value", "Timestamp"];
    const rows = [
      [
        "Total Messages",
        this.analyticsData.totalMessages || 0,
        new Date().toISOString(),
      ],
      [
        "Average Response Time",
        this.analyticsData.avgResponseTime || 0,
        new Date().toISOString(),
      ],
      [
        "User Satisfaction",
        this.analyticsData.userSatisfaction || 0,
        new Date().toISOString(),
      ],
      [
        "Active Users",
        this.analyticsData.activeUsers || 0,
        new Date().toISOString(),
      ],
    ];

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }

  trackEvent(eventName, properties = {}) {
    if (window.APP_CONFIG?.FEATURES?.ANALYTICS) {
      window.APIService?.logInteraction?.(eventName, properties);
    }
  }

  startPeriodicUpdates() {
    // Update dashboard every 30 seconds if visible
    setInterval(() => {
      if (this.isVisible) {
        this.refreshData();
      }
    }, 30000);
  }

  // Public method to add data points
  recordMessage(message, response, modelUsed, responseTime, sentiment) {
    this.updateMessageStats(
      message,
      response,
      modelUsed,
      responseTime,
      sentiment
    );
    this.saveAnalyticsData();
  }

  updateMessageStats(message, response, modelUsed, responseTime, sentiment) {
    // Initialize counters if they don't exist
    if (!this.analyticsData.totalMessages) this.analyticsData.totalMessages = 0;
    if (!this.analyticsData.modelUsage) this.analyticsData.modelUsage = {};
    if (!this.analyticsData.topQuestions) this.analyticsData.topQuestions = [];
    if (!this.analyticsData.responseTimes)
      this.analyticsData.responseTimes = [];

    // Update counters
    this.analyticsData.totalMessages++;
    this.analyticsData.modelUsage[modelUsed] =
      (this.analyticsData.modelUsage[modelUsed] || 0) + 1;
    this.analyticsData.responseTimes.push(responseTime);

    // Update top questions
    this.updateTopQuestions(message);

    // Calculate averages
    this.calculateAverages();
  }

  updateTopQuestions(question) {
    const existing = this.analyticsData.topQuestions.find(
      (q) => q.question === question
    );
    if (existing) {
      existing.count++;
    } else {
      this.analyticsData.topQuestions.push({ question, count: 1 });
    }

    // Sort by count and keep top 10
    this.analyticsData.topQuestions.sort((a, b) => b.count - a.count);
    this.analyticsData.topQuestions = this.analyticsData.topQuestions.slice(
      0,
      10
    );
  }

  calculateAverages() {
    if (
      this.analyticsData.responseTimes &&
      this.analyticsData.responseTimes.length > 0
    ) {
      const sum = this.analyticsData.responseTimes.reduce((a, b) => a + b, 0);
      this.analyticsData.avgResponseTime = Math.round(
        sum / this.analyticsData.responseTimes.length
      );
    }
  }
}

// Make AnalyticsDashboard available globally
window.AnalyticsDashboard = AnalyticsDashboard;
