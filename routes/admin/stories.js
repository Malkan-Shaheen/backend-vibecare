const express = require("express");
const nodemailer = require("nodemailer");

// Email configuration
const EMAIL_USER = "vibecare67@gmail.com";
const EMAIL_PASS = "dmuo xfwq mxhl nzpq";

// Helper function to send story status notification email
const sendStoryStatusEmail = async (
  userEmail,
  userName,
  storyTitle,
  status
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    let subject, text, html;

    if (status === "publish") {
      subject = "Your Success Story Has Been Approved! 🎉";
      text = `Dear ${userName || "User"},

Great news! Your success story "${storyTitle}" has been reviewed and approved by our admin team.

Your story is now live on the VibeCare platform and can inspire others on their mental health journey.

Thank you for sharing your inspiring story with our community!

Best regards,
The VibeCare Team`;

      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50;">Your Success Story Has Been Approved! 🎉</h2>
          <p>Dear ${userName || "User"},</p>
          <p>Great news! Your success story <strong>"${storyTitle}"</strong> has been reviewed and approved by our admin team.</p>
          <p>Your story is now live on the VibeCare platform and can inspire others on their mental health journey.</p>
          <p>Thank you for sharing your inspiring story with our community!</p>
          <p style="margin-top: 30px;">Best regards,<br>The VibeCare Team</p>
        </div>
      `;
    } else if (status === "rejected") {
      subject = "Update on Your Success Story Submission";
      text = `Dear ${userName || "User"},

We regret to inform you that your success story "${storyTitle}" has been reviewed and unfortunately does not meet our current publishing guidelines.

We encourage you to review our submission guidelines and consider submitting another story in the future. We appreciate your interest in sharing your journey with the VibeCare community.

If you have any questions, please feel free to reach out to our support team.

Best regards,
The VibeCare Team`;

      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #F44336;">Update on Your Success Story Submission</h2>
          <p>Dear ${userName || "User"},</p>
          <p>We regret to inform you that your success story <strong>"${storyTitle}"</strong> has been reviewed and unfortunately does not meet our current publishing guidelines.</p>
          <p>We encourage you to review our submission guidelines and consider submitting another story in the future. We appreciate your interest in sharing your journey with the VibeCare community.</p>
          <p>If you have any questions, please feel free to reach out to our support team.</p>
          <p style="margin-top: 30px;">Best regards,<br>The VibeCare Team</p>
        </div>
      `;
    } else {
      return; // Don't send email for pending status
    }

    const mailOptions = {
      from: EMAIL_USER,
      to: userEmail,
      subject: subject,
      text: text,
      html: html,
    };

    await transporter.sendMail(mailOptions);
    console.log(
      `✅ Story status email sent to ${userEmail} for story: ${storyTitle}`
    );
  } catch (error) {
    console.error("❌ Error sending story status email:", error);
    // Don't throw error - email failure shouldn't break the status update
  }
};

const renderPaginatedTableScript = (
  containerId,
  bodyId,
  loadingId,
  dataEndpoint
) => `
(function() {
  const container = document.getElementById("${containerId}");
  const tbody = document.getElementById("${bodyId}");
  const loadingEl = document.getElementById("${loadingId}");
  if (!container || !tbody || !loadingEl) return;
  let page = parseInt(tbody.dataset.page, 10) || 1;
  const limit = parseInt(tbody.dataset.limit, 10) || 20;
  let loading = false;
  let hasMore = tbody.dataset.hasMore === "true";

  const loadMore = async () => {
    if (loading || !hasMore) return;
    loading = true;
    loadingEl.style.display = "block";
    try {
      const nextPage = page + 1;
      const res = await fetch(\`${dataEndpoint}?page=\${nextPage}&limit=\${limit}\`);
      const payload = await res.json();
      if (payload?.status === "success" && Array.isArray(payload.data)) {
        payload.data.forEach((rowHtml) => {
          const temp = document.createElement("tbody");
          temp.innerHTML = rowHtml;
          [...temp.children].forEach((tr) => tbody.appendChild(tr));
        });
        page = nextPage;
        hasMore = Boolean(payload.hasMore);
        tbody.dataset.page = String(page);
        tbody.dataset.hasMore = hasMore ? "true" : "false";
      } else {
        hasMore = false;
        tbody.dataset.hasMore = "false";
      }
    } catch (err) {
      console.error("Failed to load paginated data:", err);
    } finally {
      loading = false;
      loadingEl.style.display = "none";
    }
  };

  container.addEventListener("scroll", () => {
    const threshold = container.scrollHeight - container.clientHeight - 60;
    if (container.scrollTop >= threshold) {
      loadMore();
    }
  });
})();
`;

const getStatusBadgeColor = (status) => {
  switch (status) {
    case "publish":
      return { bg: "#e8f5e9", color: "#2e7d32" };
    case "rejected":
      return { bg: "#ffebee", color: "#c62828" };
    case "pending":
    default:
      return { bg: "#fff3e0", color: "#ef6c00" };
  }
};

const formatStoryRowHtml = (story) => {
  const statusColors = getStatusBadgeColor(story.status);
  return `
    <tr data-story-id="${story.id}">
      <td>${story.title || "-"}</td>
      <td>${story.subtitle || "-"}</td>
      <td>${story.author || "-"}</td>
      <td>
        <select
          class="story-status-select"
          data-story-id="${story.id}"
          style="background:${statusColors.bg};color:${
    statusColors.color
  };border:1px solid ${
    statusColors.color
  };border-radius:12px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer;"
        >
          <option value="pending" ${
            story.status === "pending" ? "selected" : ""
          }>Pending</option>
          <option value="publish" ${
            story.status === "publish" ? "selected" : ""
          }>Publish</option>
          <option value="rejected" ${
            story.status === "rejected" ? "selected" : ""
          }>Rejected</option>
        </select>
      </td>
      <td>${
        story.createdAt ? new Date(story.createdAt).toLocaleString() : "N/A"
      }</td>
      <td style="display:flex;gap:8px;">
        <button
          class="view-story-btn"
          data-story-id="${story.id}"
          onclick="window.location='/admin/stories/${story.id}/view'"
          style="background:#4CAF50;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;"
        >
          View
        </button>
        <button
          class="delete-story-btn"
          data-story-id="${story.id}"
          style="background:#F44336;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;"
        >
          Delete
        </button>
      </td>
    </tr>
  `;
};

module.exports = ({ renderAdminLayout, SuccessStory, User }) => {
  const router = express.Router();

  const fetchPaginatedStories = async (page, limit) => {
    const skip = (page - 1) * limit;
    const entries = await SuccessStory.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1)
      .populate("userId", "Email Name");
    const hasMore = entries.length > limit;
    const sliced = hasMore ? entries.slice(0, limit) : entries;
    const data = sliced.map((entry) =>
      formatStoryRowHtml({
        id: entry._id.toString(),
        title: entry.title,
        subtitle: entry.subtitle,
        author: entry.userId?.Email || entry.userId?.Name || "-",
        status: entry.status || "pending",
        createdAt: entry.createdAt,
      })
    );
    return { data, hasMore };
  };

  router.get("/data", async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const result = await fetchPaginatedStories(page, limit);
      res.json({ status: "success", ...result });
    } catch (error) {
      console.error("Error loading success stories:", error);
      res
        .status(500)
        .json({ status: "error", message: "Failed to load success stories" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const story = await SuccessStory.findById(id).populate(
        "userId",
        "Email Name"
      );

      if (!story) {
        return res
          .status(404)
          .json({ status: "error", message: "Story not found" });
      }

      res.json({
        status: "success",
        data: {
          id: story._id.toString(),
          title: story.title,
          subtitle: story.subtitle,
          story: story.story,
          status: story.status || "pending",
          author: story.userId?.Email || story.userId?.Name || "-",
          createdAt: story.createdAt,
        },
      });
    } catch (error) {
      console.error("Error fetching story:", error);
      res
        .status(500)
        .json({ status: "error", message: "Failed to load story" });
    }
  });

  router.get("/:id/view", async (req, res) => {
    try {
      const { id } = req.params;
      const story = await SuccessStory.findById(id).populate(
        "userId",
        "Email Name"
      );

      if (!story) {
        return res.status(404).send(
          renderAdminLayout({
            title: "Story not found",
            activeId: "stories",
            content: `<div class="card"><h2>Story not found</h2><p>The requested story does not exist.</p><a href="/admin/stories" style="color:#ff5a5f;text-decoration:none;">← Back to stories</a></div>`,
          })
        );
      }

      const statusColors = getStatusBadgeColor(story.status || "pending");
      const createdAt = story.createdAt
        ? new Date(story.createdAt).toLocaleString()
        : "N/A";

      const content = `
        <div class="card">
          <a href="/admin/stories" style="text-decoration:none;color:#ff5a5f;font-weight:600;display:inline-block;margin-bottom:16px;">← Back to stories</a>
          <div style="border-bottom:1px solid #f0f0f5;padding-bottom:20px;margin-bottom:24px;">
            <h1 style="margin:0 0 8px 0;font-size:28px;color:#1e1e2f;">${
              story.title || "Untitled"
            }</h1>
            <p style="margin:0 0 16px 0;font-size:18px;color:#666;font-style:italic;">${
              story.subtitle || ""
            }</p>
            <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
              <span style="background:#f0f0f0;padding:8px 14px;border-radius:8px;font-size:14px;color:#555;">
                <strong>Author:</strong> ${
                  story.userId?.Email || story.userId?.Name || "Unknown"
                }
              </span>
              <span style="background:${statusColors.bg};color:${
        statusColors.color
      };padding:8px 14px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid ${
        statusColors.color
      };">
                ${
                  (story.status || "pending").charAt(0).toUpperCase() +
                  (story.status || "pending").slice(1)
                }
              </span>
              <span style="background:#f0f0f0;padding:8px 14px;border-radius:8px;font-size:14px;color:#555;">
                <strong>Created:</strong> ${createdAt}
              </span>
            </div>
          </div>
          <div>
            <h2 style="margin:0 0 16px 0;font-size:20px;color:#1e1e2f;">Story Content</h2>
            <div style="background:#f9fafc;border:1px solid #e5e7eb;border-radius:12px;padding:24px;line-height:1.8;font-size:15px;color:#374151;white-space:pre-wrap;word-wrap:break-word;">
              ${story.story || "No content available."}
            </div>
          </div>
        </div>
      `;

      res.setHeader("Content-Type", "text/html");
      res.send(
        renderAdminLayout({
          title: "View Story",
          activeId: "stories",
          content,
        })
      );
    } catch (error) {
      console.error("Error rendering story view:", error);
      res.status(500).send("Failed to load story");
    }
  });

  router.post("/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["pending", "publish", "rejected"].includes(status)) {
        return res
          .status(400)
          .json({ status: "error", message: "Invalid status value" });
      }

      // Get the story before updating to check previous status
      const oldStory = await SuccessStory.findById(id).populate(
        "userId",
        "Email Name"
      );

      if (!oldStory) {
        return res
          .status(404)
          .json({ status: "error", message: "Story not found" });
      }

      const story = await SuccessStory.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate("userId", "Email Name");

      // Send email notification if status changed to publish or rejected
      if ((status === "publish" || status === "rejected") && oldStory.userId) {
        const userEmail = oldStory.userId.Email;
        const userName =
          oldStory.userId.Name || oldStory.userId.Username || "User";
        const storyTitle = oldStory.title || "Your Story";

        // Send email asynchronously (don't wait for it)
        sendStoryStatusEmail(userEmail, userName, storyTitle, status).catch(
          (err) => {
            console.error("Failed to send story status email:", err);
          }
        );
      }

      res.json({ status: "success", data: story });
    } catch (error) {
      console.error("Error updating story status:", error);
      res
        .status(500)
        .json({ status: "error", message: "Failed to update story status" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const story = await SuccessStory.findByIdAndDelete(id);

      if (!story) {
        return res
          .status(404)
          .json({ status: "error", message: "Story not found" });
      }

      res.json({ status: "success", message: "Story deleted successfully" });
    } catch (error) {
      console.error("Error deleting story:", error);
      res
        .status(500)
        .json({ status: "error", message: "Failed to delete story" });
    }
  });

  router.get("/", async (req, res) => {
    try {
      const limit = 20;
      const totalStories = await SuccessStory.countDocuments();
      const { data, hasMore } = await fetchPaginatedStories(1, limit);
      const content = `
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
            <div>
              <h1 style="margin:0;font-size:22px;">Success Stories</h1>
              <p style="margin:4px 0 0;color:#666;font-size:14px;">
                Curated stories shared by users.
              </p>
            </div>
            <div style="display:flex;gap:12px;align-items:center;">
              <div style="background:#fdf2e9;color:#cc6c10;padding:10px 16px;border-radius:30px;font-weight:600;">
                Total: ${totalStories}
              </div>
              <button id="stories-refresh" style="background:#ffe3df;color:#b33951;border:none;border-radius:20px;padding:10px 18px;font-weight:600;cursor:pointer;">
                Refresh
              </button>
            </div>
          </div>
          <div
            id="stories-container"
            style="border:1px solid #f0f0f5;border-radius:16px;max-height:420px;overflow-y:auto;margin-top:24px;"
          >
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subtitle</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody
                id="stories-body"
                data-page="1"
                data-limit="${limit}"
                data-has-more="${hasMore}"
              >
                ${
                  data.length > 0
                    ? data.join("")
                    : `<tr><td colspan="6" style="text-align:center;padding:24px;">No stories found.</td></tr>`
                }
              </tbody>
            </table>
            <div id="stories-loading" style="display:none;padding:12px;text-align:center;font-size:13px;color:#777;">
              Loading more...
            </div>
          </div>
          
          <!-- Delete Confirmation Modal -->
          <div id="delete-story-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center;">
            <div style="background:#fff;border-radius:16px;max-width:500px;width:90%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
              <h2 style="margin:0 0 16px 0;font-size:20px;color:#1e1e2f;">Delete Story</h2>
              <p style="margin:0 0 24px 0;font-size:15px;color:#666;line-height:1.5;">
                Are you sure you want to delete this story? This action cannot be undone.
              </p>
              <div style="display:flex;gap:12px;justify-content:flex-end;">
                <button
                  id="delete-story-cancel"
                  style="background:#f0f0f0;color:#333;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;"
                >
                  Cancel
                </button>
                <button
                  id="delete-story-confirm"
                  style="background:#F44336;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
          
          <!-- Alert Modal -->
          <div id="alert-story-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1001;align-items:center;justify-content:center;">
            <div id="alert-story-content" style="background:#fff;border-radius:16px;max-width:500px;width:90%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
              <h2 id="alert-story-title" style="margin:0 0 16px 0;font-size:20px;color:#1e1e2f;"></h2>
              <p id="alert-story-message" style="margin:0 0 24px 0;font-size:15px;color:#666;line-height:1.5;"></p>
              <div style="display:flex;justify-content:flex-end;">
                <button
                  id="alert-story-ok"
                  style="background:#4CAF50;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
        <style>
          #stories-container th,
          #stories-container td {
            text-align:left;
            padding:12px 16px;
            border-bottom:1px solid #f0f0f5;
            font-size:14px;
          }
          #stories-container th {
            position:sticky;
            top:0;
            background:#fff;
            z-index:2;
            color:#cc6c10;
            text-transform:uppercase;
            font-size:12px;
            letter-spacing:0.5px;
          }
        </style>
        <script>
          ${renderPaginatedTableScript(
            "stories-container",
            "stories-body",
            "stories-loading",
            "data"
          )}
          (function() {
            const statusColors = {
              publish: { bg: "#e8f5e9", color: "#2e7d32" },
              rejected: { bg: "#ffebee", color: "#c62828" },
              pending: { bg: "#fff3e0", color: "#ef6c00" }
            };
            
            const updateSelectStyle = (select, status) => {
              const colors = statusColors[status] || statusColors.pending;
              select.style.background = colors.bg;
              select.style.color = colors.color;
              select.style.borderColor = colors.color;
            };
            
            // Initialize status selects
            const initStatusSelects = () => {
              document.querySelectorAll(".story-status-select").forEach((select) => {
                if (!select.dataset.originalStatus) {
                  select.dataset.originalStatus = select.value;
                  updateSelectStyle(select, select.value);
                }
              });
            };
            
            // Handle status changes (event delegation for dynamically added rows)
            document.addEventListener("change", async (e) => {
              if (e.target.classList.contains("story-status-select")) {
                const storyId = e.target.dataset.storyId;
                const newStatus = e.target.value;
                const originalStatus = e.target.dataset.originalStatus || "pending";
                
                // Update UI immediately
                updateSelectStyle(e.target, newStatus);
                
                try {
                  const res = await fetch(\`/admin/stories/\${storyId}/status\`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus })
                  });
                  const data = await res.json();
                  if (data.status === "success") {
                    e.target.dataset.originalStatus = newStatus;
                  } else {
                    // Revert on error
                    e.target.value = originalStatus;
                    updateSelectStyle(e.target, originalStatus);
                    showAlert("Error", "Failed to update status. Please try again.");
                  }
                } catch (err) {
                  console.error("Error updating status:", err);
                  // Revert on error
                  e.target.value = originalStatus;
                  updateSelectStyle(e.target, originalStatus);
                  showAlert("Error", "Failed to update status. Please try again.");
                }
              }
            });
            
            // Initialize on load
            initStatusSelects();
            
            // Watch for DOM changes (for pagination)
            const observer = new MutationObserver(() => {
              initStatusSelects();
            });
            const tbody = document.getElementById("stories-body");
            if (tbody) {
              observer.observe(tbody, { childList: true });
            }
            
            // Delete confirmation modal
            const deleteModal = document.getElementById("delete-story-modal");
            const deleteCancelBtn = document.getElementById("delete-story-cancel");
            const deleteConfirmBtn = document.getElementById("delete-story-confirm");
            let currentDeleteButton = null;
            let currentStoryId = null;
            
            const showDeleteModal = (storyId, button) => {
              currentStoryId = storyId;
              currentDeleteButton = button;
              // Reset button state when showing modal
              deleteConfirmBtn.textContent = "Delete";
              deleteConfirmBtn.disabled = false;
              deleteModal.style.display = "flex";
            };
            
            const hideDeleteModal = () => {
              deleteModal.style.display = "none";
              // Reset button state when hiding modal
              deleteConfirmBtn.textContent = "Delete";
              deleteConfirmBtn.disabled = false;
              currentStoryId = null;
              currentDeleteButton = null;
            };
            
            deleteCancelBtn.addEventListener("click", hideDeleteModal);
            deleteModal.addEventListener("click", (e) => {
              if (e.target === deleteModal) {
                hideDeleteModal();
              }
            });
            
            // Function to refresh the table
            const refreshTable = async () => {
              try {
                const tbody = document.getElementById("stories-body");
                const refreshBtn = document.getElementById("stories-refresh");
                const originalText = refreshBtn ? refreshBtn.textContent : "";
                
                if (refreshBtn) {
                  refreshBtn.textContent = "Refreshing...";
                  refreshBtn.disabled = true;
                }
                
                const res = await fetch("/admin/stories/data?page=1&limit=20");
                const data = await res.json();
                
                if (data.status === "success" && Array.isArray(data.data)) {
                  tbody.innerHTML = data.data.join("");
                  tbody.dataset.page = "1";
                  tbody.dataset.hasMore = data.hasMore ? "true" : "false";
                  // Re-initialize status selects for new rows
                  initStatusSelects();
                }
                
                if (refreshBtn) {
                  refreshBtn.textContent = originalText;
                  refreshBtn.disabled = false;
                }
              } catch (err) {
                console.error("Error refreshing table:", err);
                const refreshBtn = document.getElementById("stories-refresh");
                if (refreshBtn) {
                  refreshBtn.textContent = "Refresh";
                  refreshBtn.disabled = false;
                }
              }
            };
            
            // Add refresh button event listener
            const refreshBtn = document.getElementById("stories-refresh");
            if (refreshBtn) {
              refreshBtn.addEventListener("click", refreshTable);
            }
            
            deleteConfirmBtn.addEventListener("click", async () => {
              if (!currentStoryId || !currentDeleteButton) return;
              
              const originalText = currentDeleteButton.textContent;
              currentDeleteButton.textContent = "Deleting...";
              currentDeleteButton.disabled = true;
              deleteConfirmBtn.disabled = true;
              deleteConfirmBtn.textContent = "Deleting...";
              
              try {
                const res = await fetch(\`/admin/stories/\${currentStoryId}\`, {
                  method: "DELETE"
                });
                
                if (!res.ok) {
                  throw new Error(\`HTTP error! status: \${res.status}\`);
                }
                
                const data = await res.json();
                
                if (data.status === "success") {
                  hideDeleteModal();
                  // Refresh the table instantly
                  await refreshTable();
                } else {
                  showAlert("Error", data.message || "Failed to delete story. Please try again.");
                  currentDeleteButton.textContent = originalText;
                  currentDeleteButton.disabled = false;
                  deleteConfirmBtn.disabled = false;
                  deleteConfirmBtn.textContent = "Delete";
                }
              } catch (err) {
                console.error("Error deleting story:", err);
                showAlert("Error", "Failed to delete story. Please try again.");
                currentDeleteButton.textContent = originalText;
                currentDeleteButton.disabled = false;
                deleteConfirmBtn.disabled = false;
                deleteConfirmBtn.textContent = "Delete";
              }
            });
            
            // Handle delete button clicks
            document.addEventListener("click", (e) => {
              if (e.target.classList.contains("delete-story-btn")) {
                const storyId = e.target.dataset.storyId;
                if (!storyId) return;
                showDeleteModal(storyId, e.target);
              }
            });
            
            // Alert modal functions
            const alertModal = document.getElementById("alert-story-modal");
            const alertTitle = document.getElementById("alert-story-title");
            const alertMessage = document.getElementById("alert-story-message");
            const alertOkBtn = document.getElementById("alert-story-ok");
            
            const showAlert = (title, message) => {
              alertTitle.textContent = title;
              alertMessage.textContent = message;
              alertModal.style.display = "flex";
            };
            
            const hideAlert = () => {
              alertModal.style.display = "none";
            };
            
            alertOkBtn.addEventListener("click", hideAlert);
            alertModal.addEventListener("click", (e) => {
              if (e.target === alertModal) {
                hideAlert();
              }
            });
          })();
        </script>
      `;
      res.setHeader("Content-Type", "text/html");
      res.send(
        renderAdminLayout({
          title: "Success Stories",
          activeId: "stories",
          content,
        })
      );
    } catch (error) {
      console.error("Error rendering stories page:", error);
      res.status(500).send("Failed to load stories");
    }
  });

  return router;
};
