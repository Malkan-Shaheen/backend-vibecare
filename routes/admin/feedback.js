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
  return `
    <tr>
      <td>${fb.ticketNumber || "-"}</td>
      <td>${fb.userEmail || "-"}</td>
      <td>${fb.rating ?? "-"}</td>
      <td>${fb.status || "-"}</td>
      <td>${fb.createdAt ? new Date(fb.createdAt).toLocaleString() : "N/A"}</td>
    </tr>
  `;
};

module.exports = ({ renderAdminLayout, Feedback }) => {
  const router = express.Router();

  const fetchPaginatedFeedback = async (page, limit) => {
    const skip = (page - 1) * limit;
    const entries = await Feedback.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1)
      .populate("userId", "Email");
    const hasMore = entries.length > limit;
    const sliced = hasMore ? entries.slice(0, limit) : entries;
    const data = sliced.map((entry) =>
      formatFeedbackRowHtml({
        ticketNumber: entry.ticketNumber,
        userEmail: entry.userId?.Email,
        rating: entry.rating,
        status: entry.status,
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

  router.get("/", async (req, res) => {
    try {
      const limit = 20;
      const { data, hasMore } = await fetchPaginatedFeedback(1, limit);
      const content = `
        <div class="card">
          <h1 style="margin-top:0;font-size:24px;">Feedback</h1>
          <p style="color:#555;margin-bottom:16px;font-size:14px;">Latest user feedback and tickets.</p>
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

