// js/team-collaboration.js - Team Collaboration for Phase 9

class TeamCollaboration {
  constructor() {
    this.teamConfig = this.loadTeamConfig();
    this.teamMembers = new Map();
    this.activeCollaborations = new Map();
    this.init();
  }

  init() {
    this.setupTeamFeatures();
    this.loadTeamMembers();
    this.setupRealTimeUpdates();
    this.setupPermissionSystem();
  }

  loadTeamConfig() {
    return {
      ENABLED: true,
      MAX_TEAM_SIZE: 10,
      ROLES: ["owner", "admin", "member", "viewer"],
      PERMISSIONS: {
        owner: ["read", "write", "delete", "invite", "manage"],
        admin: ["read", "write", "delete", "invite"],
        member: ["read", "write"],
        viewer: ["read"],
      },
      COLLABORATION: {
        REAL_TIME_UPDATES: true,
        PRESENCE_INDICATORS: true,
        COMMENT_SYSTEM: true,
        SHARED_SESSIONS: true,
      },
    };
  }

  setupTeamFeatures() {
    if (!this.teamConfig.ENABLED) return;

    this.addTeamUI();
    this.setupInviteSystem();
    this.setupRoleManagement();
  }

  addTeamUI() {
    // Add team management button
    const teamBtn = document.createElement("button");
    teamBtn.id = "teamManagementBtn";
    teamBtn.className =
      "p-2 rounded-xl hover:bg-slate-100 transition-all duration-200";
    teamBtn.innerHTML = '<i class="fas fa-users text-slate-600"></i>';
    teamBtn.title = "Team Collaboration";
    teamBtn.addEventListener("click", () => this.showTeamManagement());

    // Add to header
    const headerButtons = document.querySelector("header .flex.space-x-3");
    headerButtons.appendChild(teamBtn);

    // Add presence indicators
    this.addPresenceIndicators();
  }

  addPresenceIndicators() {
    const presenceContainer = document.createElement("div");
    presenceContainer.id = "presenceIndicators";
    presenceContainer.className = "flex items-center space-x-2 ml-4";

    document
      .querySelector("header .flex.space-x-3")
      .appendChild(presenceContainer);
  }

  loadTeamMembers() {
    // Load team members from localStorage or API
    const savedMembers = localStorage.getItem("team_members");
    if (savedMembers) {
      const members = JSON.parse(savedMembers);
      members.forEach((member) => this.teamMembers.set(member.id, member));
    } else {
      // Add current user as owner
      const currentUser = {
        id: this.generateUserId(),
        name: "You",
        email: "user@example.com",
        role: "owner",
        status: "online",
        lastActive: new Date().toISOString(),
        avatar: this.generateAvatar("You"),
      };
      this.teamMembers.set(currentUser.id, currentUser);
      this.saveTeamMembers();
    }

    this.updatePresenceIndicators();
  }

  setupRealTimeUpdates() {
    if (!this.teamConfig.COLLABORATION.REAL_TIME_UPDATES) return;

    // Simulate real-time updates (in production, use WebSockets)
    setInterval(() => {
      this.updateTeamPresence();
    }, 30000);

    // Listen for collaboration events
    this.setupCollaborationEvents();
  }

  setupPermissionSystem() {
    // Implement role-based access control
    this.verifyPermissions();
    this.setupPermissionChecks();
  }

  // Team Management
  showTeamManagement() {
    this.createTeamManagementModal();
  }

  createTeamManagementModal() {
    const modalHTML = `
            <div id="teamManagementModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-bold text-slate-800">Team Management</h3>
                        <button id="closeTeamModal" class="text-slate-500 hover:text-slate-700 transition-colors">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Team Members -->
                        <div class="lg:col-span-2">
                            <h4 class="font-semibold text-slate-800 mb-4">Team Members</h4>
                            <div class="space-y-3" id="teamMembersList">
                                ${this.renderTeamMembersList()}
                            </div>
                            
                            <button id="inviteMemberBtn" class="mt-4 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                                <i class="fas fa-user-plus mr-2"></i>Invite Team Member
                            </button>
                        </div>

                        <!-- Team Settings -->
                        <div class="space-y-6">
                            <div>
                                <h4 class="font-semibold text-slate-800 mb-4">Team Settings</h4>
                                <div class="space-y-3">
                                    <label class="flex items-center">
                                        <input type="checkbox" id="realTimeUpdates" ${
                                          this.teamConfig.COLLABORATION
                                            .REAL_TIME_UPDATES
                                            ? "checked"
                                            : ""
                                        } class="mr-2">
                                        <span class="text-sm">Real-time updates</span>
                                    </label>
                                    <label class="flex items-center">
                                        <input type="checkbox" id="presenceIndicators" ${
                                          this.teamConfig.COLLABORATION
                                            .PRESENCE_INDICATORS
                                            ? "checked"
                                            : ""
                                        } class="mr-2">
                                        <span class="text-sm">Presence indicators</span>
                                    </label>
                                    <label class="flex items-center">
                                        <input type="checkbox" id="commentSystem" ${
                                          this.teamConfig.COLLABORATION
                                            .COMMENT_SYSTEM
                                            ? "checked"
                                            : ""
                                        } class="mr-2">
                                        <span class="text-sm">Comment system</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <h4 class="font-semibold text-slate-800 mb-4">Quick Actions</h4>
                                <div class="space-y-2">
                                    <button id="exportTeamData" class="w-full text-left p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                        <i class="fas fa-download mr-2 text-blue-500"></i>
                                        Export Team Data
                                    </button>
                                    <button id="teamAnalytics" class="w-full text-left p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                        <i class="fas fa-chart-bar mr-2 text-green-500"></i>
                                        Team Analytics
                                    </button>
                                    <button id="manageRoles" class="w-full text-left p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                        <i class="fas fa-shield-alt mr-2 text-purple-500"></i>
                                        Manage Roles
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    this.setupTeamModalEvents();
  }

  renderTeamMembersList() {
    let html = "";
    this.teamMembers.forEach((member) => {
      html += `
                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <div class="relative">
                            <img src="${member.avatar}" alt="${
        member.name
      }" class="w-8 h-8 rounded-full">
                            <div class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                              member.status === "online"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }"></div>
                        </div>
                        <div>
                            <div class="font-medium text-slate-800">${
                              member.name
                            }</div>
                            <div class="text-xs text-slate-500">${
                              member.role
                            } • ${this.formatLastActive(
        member.lastActive
      )}</div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">${
                          member.role
                        }</span>
                        ${
                          member.role !== "owner"
                            ? `
                            <button class="p-1 text-slate-400 hover:text-slate-600 transition-colors" data-member-id="${member.id}" data-action="edit">
                                <i class="fas fa-edit text-xs"></i>
                            </button>
                            <button class="p-1 text-slate-400 hover:text-red-600 transition-colors" data-member-id="${member.id}" data-action="remove">
                                <i class="fas fa-trash text-xs"></i>
                            </button>
                        `
                            : ""
                        }
                    </div>
                </div>
            `;
    });
    return html;
  }

  setupTeamModalEvents() {
    document.getElementById("closeTeamModal").addEventListener("click", () => {
      this.closeTeamManagementModal();
    });

    document.getElementById("inviteMemberBtn").addEventListener("click", () => {
      this.showInviteModal();
    });

    // Team settings
    document
      .getElementById("realTimeUpdates")
      .addEventListener("change", (e) => {
        this.updateTeamSetting("REAL_TIME_UPDATES", e.target.checked);
      });

    document
      .getElementById("presenceIndicators")
      .addEventListener("change", (e) => {
        this.updateTeamSetting("PRESENCE_INDICATORS", e.target.checked);
      });

    document.getElementById("commentSystem").addEventListener("change", (e) => {
      this.updateTeamSetting("COMMENT_SYSTEM", e.target.checked);
    });

    // Quick actions
    document.getElementById("exportTeamData").addEventListener("click", () => {
      this.exportTeamData();
    });

    // Member actions
    document.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const memberId = e.target.closest("button").dataset.memberId;
        this.editTeamMember(memberId);
      });
    });

    document.querySelectorAll('[data-action="remove"]').forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const memberId = e.target.closest("button").dataset.memberId;
        this.removeTeamMember(memberId);
      });
    });
  }

  closeTeamManagementModal() {
    document.getElementById("teamManagementModal").remove();
  }

  // Invite System
  showInviteModal() {
    const inviteHTML = `
            <div id="inviteModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-slate-800">Invite Team Member</h3>
                        <button id="closeInviteModal" class="text-slate-500 hover:text-slate-700 transition-colors">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                            <input type="email" id="inviteEmail" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="team@example.com">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">Role</label>
                            <select id="inviteRole" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                                <option value="viewer">Viewer</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">Permissions</label>
                            <div class="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg" id="permissionsPreview">
                                Can read and write conversations
                            </div>
                        </div>
                    </div>

                    <div class="flex space-x-3 mt-6">
                        <button id="cancelInvite" class="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                            Cancel
                        </button>
                        <button id="sendInvite" class="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                            Send Invite
                        </button>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", inviteHTML);
    this.setupInviteModalEvents();
  }

  setupInviteModalEvents() {
    document
      .getElementById("closeInviteModal")
      .addEventListener("click", () => {
        document.getElementById("inviteModal").remove();
      });

    document.getElementById("cancelInvite").addEventListener("click", () => {
      document.getElementById("inviteModal").remove();
    });

    document.getElementById("sendInvite").addEventListener("click", () => {
      this.sendInvite();
    });

    // Update permissions preview
    document.getElementById("inviteRole").addEventListener("change", (e) => {
      this.updatePermissionsPreview(e.target.value);
    });
  }

  updatePermissionsPreview(role) {
    const permissions = this.teamConfig.PERMISSIONS[role] || [];
    const preview = document.getElementById("permissionsPreview");

    if (permissions.includes("manage")) {
      preview.textContent =
        "Full access: Can manage team and all conversations";
    } else if (permissions.includes("invite")) {
      preview.textContent =
        "Admin access: Can invite members and manage conversations";
    } else if (permissions.includes("write")) {
      preview.textContent = "Member access: Can read and write conversations";
    } else {
      preview.textContent = "Viewer access: Can read conversations only";
    }
  }

  async sendInvite() {
    const email = document.getElementById("inviteEmail").value;
    const role = document.getElementById("inviteRole").value;

    if (!this.validateEmail(email)) {
      this.showNotification("Please enter a valid email address", "error");
      return;
    }

    // Simulate invite sending
    const invite = {
      id: this.generateInviteId(),
      email,
      role,
      status: "pending",
      created: new Date().toISOString(),
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    // Save invite
    this.saveInvite(invite);

    // Show success message
    this.showNotification(`Invite sent to ${email}`, "success");
    document.getElementById("inviteModal").remove();

    // In production, this would send an actual email
    console.log("Invite sent:", invite);
  }

  // Collaboration Features
  setupCollaborationEvents() {
    // Listen for chat events and broadcast to team
    document.addEventListener("chatMessageSent", (e) => {
      this.broadcastMessage(e.detail);
    });

    document.addEventListener("chatMessageReceived", (e) => {
      this.showCollaboratorActivity(e.detail);
    });
  }

  broadcastMessage(message) {
    if (!this.teamConfig.COLLABORATION.REAL_TIME_UPDATES) return;

    // In production, this would use WebSockets to broadcast to team
    console.log("Broadcasting message to team:", message);

    // Simulate team members receiving the update
    this.simulateTeamActivity(message);
  }

  simulateTeamActivity(message) {
    // Simulate other team members being active
    this.teamMembers.forEach((member, id) => {
      if (member.status === "online" && Math.random() > 0.7) {
        setTimeout(() => {
          this.showCollaboratorTyping(member);
        }, Math.random() * 3000);
      }
    });
  }

  showCollaboratorTyping(member) {
    const typingIndicator = document.createElement("div");
    typingIndicator.className =
      "collaborator-typing flex items-center space-x-2 p-2 bg-blue-50 rounded-lg mb-2";
    typingIndicator.innerHTML = `
            <div class="flex space-x-1">
                <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
            <span class="text-sm text-blue-700">${member.name} is typing...</span>
        `;

    const chatContainer = document.getElementById("chatContainer");
    chatContainer.appendChild(typingIndicator);

    // Remove after 3 seconds
    setTimeout(() => {
      if (typingIndicator.parentNode) {
        typingIndicator.remove();
      }
    }, 3000);
  }

  showCollaboratorActivity(activity) {
    if (!this.teamConfig.COLLABORATION.PRESENCE_INDICATORS) return;

    // Show which team members are viewing the same conversation
    this.updatePresenceIndicators();
  }

  updatePresenceIndicators() {
    const container = document.getElementById("presenceIndicators");
    if (!container) return;

    container.innerHTML = "";

    this.teamMembers.forEach((member) => {
      if (member.status === "online" && member.role !== "owner") {
        const indicator = document.createElement("div");
        indicator.className = "relative group";
        indicator.title = `${member.name} (${member.role})`;
        indicator.innerHTML = `
                    <img src="${member.avatar}" alt="${member.name}" class="w-6 h-6 rounded-full border-2 border-white">
                    <div class="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                `;
        container.appendChild(indicator);
      }
    });
  }

  // Utility Methods
  generateUserId() {
    return "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  generateInviteId() {
    return "inv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  generateAvatar(name) {
    // Generate a simple avatar based on name
    const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];
    const color = colors[name.length % colors.length];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=${color.replace("#", "")}&color=fff&size=128`;
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  formatLastActive(timestamp) {
    const now = new Date();
    const lastActive = new Date(timestamp);
    const diff = now - lastActive;

    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  updateTeamSetting(setting, value) {
    this.teamConfig.COLLABORATION[setting] = value;

    if (setting === "PRESENCE_INDICATORS") {
      if (value) {
        this.addPresenceIndicators();
        this.updatePresenceIndicators();
      } else {
        const indicators = document.getElementById("presenceIndicators");
        if (indicators) indicators.remove();
      }
    }

    this.showNotification(
      `${setting.replace("_", " ")} ${value ? "enabled" : "disabled"}`,
      "success"
    );
  }

  updateTeamPresence() {
    // Simulate team member status changes
    this.teamMembers.forEach((member, id) => {
      if (member.role !== "owner" && Math.random() > 0.8) {
        member.status = Math.random() > 0.3 ? "online" : "away";
        member.lastActive = new Date().toISOString();
      }
    });

    this.saveTeamMembers();
    this.updatePresenceIndicators();
  }

  saveTeamMembers() {
    const membersArray = Array.from(this.teamMembers.values());
    localStorage.setItem("team_members", JSON.stringify(membersArray));
  }

  saveInvite(invite) {
    const invites = JSON.parse(localStorage.getItem("team_invites") || "[]");
    invites.push(invite);
    localStorage.setItem("team_invites", JSON.stringify(invites));
  }

  showNotification(message, type = "info") {
    // Use existing notification system or create a simple one
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === "success"
        ? "bg-green-500 text-white"
        : type === "error"
        ? "bg-red-500 text-white"
        : "bg-blue-500 text-white"
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Permission checks
  verifyPermissions() {
    const userRole = this.getCurrentUserRole();
    const permissions = this.teamConfig.PERMISSIONS[userRole] || [];

    // Disable features based on permissions
    if (!permissions.includes("write")) {
      this.disableWriteFeatures();
    }

    if (!permissions.includes("invite")) {
      this.hideInviteFeatures();
    }
  }

  getCurrentUserRole() {
    // In real app, this would come from authentication
    return "owner"; // Default for demo
  }

  disableWriteFeatures() {
    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");

    if (messageInput) messageInput.disabled = true;
    if (sendButton) sendButton.disabled = true;

    if (messageInput) {
      messageInput.placeholder = "Read-only access";
    }
  }

  hideInviteFeatures() {
    const inviteBtn = document.getElementById("inviteMemberBtn");
    if (inviteBtn) inviteBtn.style.display = "none";
  }

  // Public API
  getTeamStatus() {
    return {
      totalMembers: this.teamMembers.size,
      onlineMembers: Array.from(this.teamMembers.values()).filter(
        (m) => m.status === "online"
      ).length,
      activeCollaborations: this.activeCollaborations.size,
      settings: this.teamConfig.COLLABORATION,
    };
  }

  addTeamMember(memberData) {
    const member = {
      id: this.generateUserId(),
      ...memberData,
      status: "online",
      lastActive: new Date().toISOString(),
      avatar: this.generateAvatar(memberData.name),
    };

    this.teamMembers.set(member.id, member);
    this.saveTeamMembers();
    this.updatePresenceIndicators();

    return member;
  }

  removeTeamMember(memberId) {
    if (this.teamMembers.has(memberId)) {
      const member = this.teamMembers.get(memberId);
      if (member.role === "owner") {
        this.showNotification("Cannot remove team owner", "error");
        return false;
      }

      this.teamMembers.delete(memberId);
      this.saveTeamMembers();
      this.updatePresenceIndicators();
      this.showNotification(`Removed ${member.name} from team`, "success");
      return true;
    }
    return false;
  }
}

// Make TeamCollaboration available globally
window.TeamCollaboration = TeamCollaboration;
