const express = require("express");

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

const formatFeedbackRowHtml = (fb) => {
  const statusBadge = fb.responded
    ? '<span style="background:#e8f5e9;color:#2e7d32;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:600;">Responded</span>'
    : '<span style="background:#fff3e0;color:#ef6c00;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:600;">Pending</span>';

  return `
    <tr data-feedback-id="${fb.id}">
      <td>${fb.ticketNumber || "-"}</td>
      <td>${fb.userEmail || "-"}</td>
      <td>${
        fb.rating !== null && fb.rating !== undefined
          ? "⭐".repeat(Math.min(fb.rating, 5)) + ` (${fb.rating})`
          : "-"
      }</td>
      <td>${statusBadge}</td>
      <td>${fb.createdAt ? new Date(fb.createdAt).toLocaleString() : "N/A"}</td>
      <td style="display:flex;gap:8px;">
        <button
          class="view-feedback-btn"
          data-feedback-id="${fb.id}"
          onclick="window.location='/admin/feedback/${fb.id}/view'"
          style="background:#4CAF50;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;"
        >
          View
        </button>
        ${
          !fb.responded
            ? `
          <button
            class="respond-feedback-btn"
            data-feedback-id="${fb.id}"
            style="background:#9C27B0;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;"
          >
            Respond
          </button>
        `
            : ""
        }
        <button
          class="delete-feedback-btn"
          data-feedback-id="${fb.id}"
          style="background:#F44336;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;"
        >
          Delete
        </button>
      </td>
    </tr>
  `;
};

module.exports = ({ renderAdminLayout, Feedback }) => {
  const router = express.Router();

  const fetchPaginatedFeedback = async (page, limit) => {
    const skip = (page - 1) * limit;
    // Sort: unresponded first, then by date
    const entries = await Feedback.find()
      .sort({ responded: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit + 1)
      .populate("userId", "Email Name");
    const hasMore = entries.length > limit;
    const sliced = hasMore ? entries.slice(0, limit) : entries;
    const data = sliced.map((entry) =>
      formatFeedbackRowHtml({
        id: entry._id.toString(),
        ticketNumber: entry.ticketNumber,
        userEmail: entry.userId?.Email || "-",
        rating: entry.rating,
        status: entry.status,
        responded: entry.responded || false,
        createdAt: entry.createdAt,
      })
    );
    return { data, hasMore };
  };

  router.get("/data", async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const result = await fetchPaginatedFeedback(page, limit);
      res.json({ status: "success", ...result });
    } catch (error) {
      console.error("Error loading feedback:", error);
      res
        .status(500)
        .json({ status: "error", message: "Failed to load feedback" });
    }
  });

  router.get("/:id/view", async (req, res) => {
    try {
      const { id } = req.params;
      const feedback = await Feedback.findById(id).populate(
        "userId",
        "Email Name"
      );

      if (!feedback) {
        return res.status(404).send(
          renderAdminLayout({
            title: "Feedback not found",
            activeId: "feedback",
            content: `<div class="card"><h2>Feedback not found</h2><p>The requested feedback does not exist.</p><a href="/admin/feedback" style="color:#ff5a5f;text-decoration:none;">← Back to feedback</a></div>`,
          })
        );
      }

      const createdAt = feedback.createdAt
        ? new Date(feedback.createdAt).toLocaleString()
        : "N/A";
      const statusBadge = feedback.responded
        ? '<span style="background:#e8f5e9;color:#2e7d32;padding:8px 14px;border-radius:8px;font-size:14px;font-weight:600;">Responded</span>'
        : '<span style="background:#fff3e0;color:#ef6c00;padding:8px 14px;border-radius:8px;font-size:14px;font-weight:600;">Pending</span>';

      const content = `
        <div class="card">
          <a href="/admin/feedback" style="text-decoration:none;color:#ff5a5f;font-weight:600;display:inline-block;margin-bottom:16px;">← Back to feedback</a>
          <div style="border-bottom:1px solid #f0f0f5;padding-bottom:20px;margin-bottom:24px;">
            <h1 style="margin:0 0 16px 0;font-size:28px;color:#1e1e2f;">Feedback Details</h1>
            <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
              <span style="background:#f0f0f0;padding:8px 14px;border-radius:8px;font-size:14px;color:#555;">
                <strong>Ticket:</strong> ${feedback.ticketNumber || "N/A"}
              </span>
              <span style="background:#f0f0f0;padding:8px 14px;border-radius:8px;font-size:14px;color:#555;">
                <strong>User:</strong> ${
                  feedback.userId?.Email || feedback.userId?.Name || "Unknown"
                }
              </span>
              ${statusBadge}
              <span style="background:#f0f0f0;padding:8px 14px;border-radius:8px;font-size:14px;color:#555;">
                <strong>Submitted:</strong> ${createdAt}
              </span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:20px;">
            ${
              feedback.rating !== null && feedback.rating !== undefined
                ? `
              <div>
                <h3 style="margin:0 0 8px 0;font-size:18px;color:#1e1e2f;">Rating</h3>
                <div style="font-size:24px;color:#ff8c00;">
                  ${"⭐".repeat(Math.min(feedback.rating, 5))} (${
                    feedback.rating
                  }/5)
                </div>
              </div>
            `
                : ""
            }
            ${
              feedback.selectedImprovement
                ? `
              <div>
                <h3 style="margin:0 0 8px 0;font-size:18px;color:#1e1e2f;">Improvement Suggestion</h3>
                <div style="background:#f9fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px;font-size:15px;color:#374151;">
                  ${feedback.selectedImprovement}
                </div>
              </div>
            `
                : ""
            }
            ${
              feedback.feedback
                ? `
              <div>
                <h3 style="margin:0 0 8px 0;font-size:18px;color:#1e1e2f;">Feedback</h3>
                <div style="background:#f9fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px;font-size:15px;color:#374151;line-height:1.6;white-space:pre-wrap;word-wrap:break-word;">
                  ${feedback.feedback}
                </div>
              </div>
            `
                : ""
            }
            ${
              feedback.adminResponse
                ? `
              <div>
                <h3 style="margin:0 0 8px 0;font-size:18px;color:#1e1e2f;">Admin Response</h3>
                <div style="background:#e8f5e9;border:1px solid #c8e6c9;border-radius:12px;padding:16px;font-size:15px;color:#2e7d32;line-height:1.6;white-space:pre-wrap;word-wrap:break-word;">
                  ${feedback.adminResponse}
                </div>
              </div>
            `
                : ""
            }
          </div>
        </div>
      `;

      res.setHeader("Content-Type", "text/html");
      res.send(
        renderAdminLayout({
          title: "View Feedback",
          activeId: "feedback",
          content,
        })
      );
    } catch (error) {
      console.error("Error rendering feedback view:", error);
      res.status(500).send("Failed to load feedback");
    }
  });

  router.post("/:id/respond", async (req, res) => {
    try {
      const { id } = req.params;
      const feedback = await Feedback.findByIdAndUpdate(
        id,
        { status: "Closed", responded: true },
        { new: true }
      );

      if (!feedback) {
        return res
          .status(404)
          .json({ status: "error", message: "Feedback not found" });
      }

      res.json({ status: "success", data: feedback });
    } catch (error) {
      console.error("Error updating feedback status:", error);
      res
        .status(500)
        .json({ status: "error", message: "Failed to update feedback status" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const feedback = await Feedback.findByIdAndDelete(id);

      if (!feedback) {
        return res
          .status(404)
          .json({ status: "error", message: "Feedback not found" });
      }

      res.json({ status: "success", message: "Feedback deleted successfully" });
    } catch (error) {
      console.error("Error deleting feedback:", error);
      res
        .status(500)
        .json({ status: "error", message: "Failed to delete feedback" });
    }
  });

  router.get("/", async (req, res) => {
    try {
      const limit = 20;
      const totalFeedback = await Feedback.countDocuments();
      const { data, hasMore } = await fetchPaginatedFeedback(1, limit);
      const content = `
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
            <div>
              <h1 style="margin:0;font-size:24px;">Feedback</h1>
              <p style="color:#555;margin:4px 0 0;font-size:14px;">Latest user feedback and tickets.</p>
            </div>
            <div style="display:flex;gap:12px;align-items:center;">
              <div style="background:#fff6f6;color:#ff5a5f;padding:10px 16px;border-radius:30px;font-weight:600;">
                Total: ${totalFeedback}
              </div>
              <button id="feedback-refresh" style="background:#ffe3df;color:#b33951;border:none;border-radius:20px;padding:10px 18px;font-weight:600;cursor:pointer;">
                Refresh
              </button>
            </div>
          </div>
          <div
            id="feedback-container"
            style="border:1px solid #f0f0f5;border-radius:16px;max-height:420px;overflow-y:auto;"
          >
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>User</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Submitted At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody
                id="feedback-body"
                data-page="1"
                data-limit="${limit}"
                data-has-more="${hasMore}"
              >
                ${data.join("")}
              </tbody>
            </table>
            <div id="feedback-loading" style="display:none;padding:12px;text-align:center;font-size:13px;color:#777;">
              Loading more...
            </div>
          </div>
          
          <!-- Delete Confirmation Modal -->
          <div id="delete-feedback-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center;">
            <div style="background:#fff;border-radius:16px;max-width:500px;width:90%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
              <h2 style="margin:0 0 16px 0;font-size:20px;color:#1e1e2f;">Delete Feedback</h2>
              <p style="margin:0 0 24px 0;font-size:15px;color:#666;line-height:1.5;">
                Are you sure you want to delete this feedback? This action cannot be undone.
              </p>
              <div style="display:flex;gap:12px;justify-content:flex-end;">
                <button
                  id="delete-feedback-cancel"
                  style="background:#f0f0f0;color:#333;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;"
                >
                  Cancel
                </button>
                <button
                  id="delete-feedback-confirm"
                  style="background:#F44336;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
          
          <!-- Alert Modal -->
          <div id="alert-feedback-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1001;align-items:center;justify-content:center;">
            <div id="alert-feedback-content" style="background:#fff;border-radius:16px;max-width:500px;width:90%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
              <h2 id="alert-feedback-title" style="margin:0 0 16px 0;font-size:20px;color:#1e1e2f;"></h2>
              <p id="alert-feedback-message" style="margin:0 0 24px 0;font-size:15px;color:#666;line-height:1.5;"></p>
              <div style="display:flex;justify-content:flex-end;">
                <button
                  id="alert-feedback-ok"
                  style="background:#4CAF50;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
        <style>
          #feedback-container th,
          #feedback-container td {
            text-align:left;
            padding:12px 16px;
            border-bottom:1px solid #f0f0f5;
            font-size:14px;
          }
          #feedback-container th {
            position:sticky;
            top:0;
            background:#fff;
            z-index:2;
            color:#5f0f09;
            text-transform:uppercase;
            font-size:12px;
            letter-spacing:0.5px;
          }
        </style>
        <script>
          ${renderPaginatedTableScript(
            "feedback-container",
            "feedback-body",
            "feedback-loading",
            "data"
          )}
          (function() {
            // Handle respond button clicks
            document.addEventListener("click", async (e) => {
              if (e.target.classList.contains("respond-feedback-btn")) {
                const feedbackId = e.target.dataset.feedbackId;
                if (!feedbackId) return;
                
                const originalText = e.target.textContent;
                e.target.textContent = "Processing...";
                e.target.disabled = true;
                
                try {
                  const res = await fetch(\`/admin/feedback/\${feedbackId}/respond\`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                  });
                  const data = await res.json();
                  
                  if (data.status === "success") {
                    // Reload the page to show updated status
                    window.location.reload();
                  } else {
                    showAlert("Error", "Failed to update feedback status. Please try again.");
                    e.target.textContent = originalText;
                    e.target.disabled = false;
                  }
                } catch (err) {
                  console.error("Error responding to feedback:", err);
                  showAlert("Error", "Failed to update feedback status. Please try again.");
                  e.target.textContent = originalText;
                  e.target.disabled = false;
                }
              }
            });
            
            // Delete confirmation modal
            const deleteModal = document.getElementById("delete-feedback-modal");
            const deleteCancelBtn = document.getElementById("delete-feedback-cancel");
            const deleteConfirmBtn = document.getElementById("delete-feedback-confirm");
            let currentDeleteButton = null;
            let currentFeedbackId = null;
            
            const showDeleteModal = (feedbackId, button) => {
              currentFeedbackId = feedbackId;
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
              currentFeedbackId = null;
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
                const tbody = document.getElementById("feedback-body");
                const refreshBtn = document.getElementById("feedback-refresh");
                const originalText = refreshBtn ? refreshBtn.textContent : "";
                
                if (refreshBtn) {
                  refreshBtn.textContent = "Refreshing...";
                  refreshBtn.disabled = true;
                }
                
                const res = await fetch("/admin/feedback/data?page=1&limit=20");
                const data = await res.json();
                
                if (data.status === "success" && Array.isArray(data.data)) {
                  tbody.innerHTML = data.data.join("");
                  tbody.dataset.page = "1";
                  tbody.dataset.hasMore = data.hasMore ? "true" : "false";
                }
                
                if (refreshBtn) {
                  refreshBtn.textContent = originalText;
                  refreshBtn.disabled = false;
                }
              } catch (err) {
                console.error("Error refreshing table:", err);
                const refreshBtn = document.getElementById("feedback-refresh");
                if (refreshBtn) {
                  refreshBtn.textContent = "Refresh";
                  refreshBtn.disabled = false;
                }
              }
            };
            
            // Add refresh button event listener
            const refreshBtn = document.getElementById("feedback-refresh");
            if (refreshBtn) {
              refreshBtn.addEventListener("click", refreshTable);
            }
            
            deleteConfirmBtn.addEventListener("click", async () => {
              if (!currentFeedbackId || !currentDeleteButton) return;
              
              const originalText = currentDeleteButton.textContent;
              currentDeleteButton.textContent = "Deleting...";
              currentDeleteButton.disabled = true;
              deleteConfirmBtn.disabled = true;
              deleteConfirmBtn.textContent = "Deleting...";
              
              try {
                const res = await fetch(\`/admin/feedback/\${currentFeedbackId}\`, {
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
                  showAlert("Error", data.message || "Failed to delete feedback. Please try again.");
                  currentDeleteButton.textContent = originalText;
                  currentDeleteButton.disabled = false;
                  deleteConfirmBtn.disabled = false;
                  deleteConfirmBtn.textContent = "Delete";
                }
              } catch (err) {
                console.error("Error deleting feedback:", err);
                showAlert("Error", "Failed to delete feedback. Please try again.");
                currentDeleteButton.textContent = originalText;
                currentDeleteButton.disabled = false;
                deleteConfirmBtn.disabled = false;
                deleteConfirmBtn.textContent = "Delete";
              }
            });
            
            // Handle delete button clicks
            document.addEventListener("click", (e) => {
              if (e.target.classList.contains("delete-feedback-btn")) {
                const feedbackId = e.target.dataset.feedbackId;
                if (!feedbackId) return;
                showDeleteModal(feedbackId, e.target);
              }
            });
            
            // Alert modal functions
            const alertModal = document.getElementById("alert-feedback-modal");
            const alertTitle = document.getElementById("alert-feedback-title");
            const alertMessage = document.getElementById("alert-feedback-message");
            const alertOkBtn = document.getElementById("alert-feedback-ok");
            
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
          title: "Feedback",
          activeId: "feedback",
          content,
        })
      );
    } catch (error) {
      console.error("Error rendering feedback page:", error);
      res.status(500).send("Failed to load feedback");
    }
  });

  return router;
};
