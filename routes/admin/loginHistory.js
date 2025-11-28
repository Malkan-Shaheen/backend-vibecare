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

const formatLoginRowHtml = (entry) => {
  const dateStr =
    entry.date && entry.time
      ? `${entry.date} ${entry.time}`
      : entry.createdAt
      ? new Date(entry.createdAt).toLocaleString()
      : "N/A";
  return `
    <tr>
      <td>${entry.email || "N/A"}</td>
      <td>${entry.device || "N/A"}</td>
      <td>${entry.ip || "N/A"}</td>
      <td>${dateStr}</td>
    </tr>
  `;
};

module.exports = ({ renderAdminLayout, LoginHistory }) => {
  const router = express.Router();

  const fetchPaginatedLoginHistory = async (page, limit) => {
    const skip = (page - 1) * limit;
    const entries = await LoginHistory.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1);
    const hasMore = entries.length > limit;
    const sliced = hasMore ? entries.slice(0, limit) : entries;
    const data = sliced.map((entry) =>
      formatLoginRowHtml({
        email: entry.email,
        device: entry.device,
        ip: entry.ip,
        date: entry.date,
        time: entry.time,
        createdAt: entry.createdAt,
      })
    );
    return { data, hasMore };
  };

  router.get("/data", async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const result = await fetchPaginatedLoginHistory(page, limit);
      res.json({ status: "success", ...result });
    } catch (error) {
      console.error("Error loading login history:", error);
      res
        .status(500)
        .json({ status: "error", message: "Failed to load login history" });
    }
  });

  router.get("/", async (req, res) => {
    try {
      const limit = 20;
      const { data, hasMore } = await fetchPaginatedLoginHistory(1, limit);
      const content = `
        <div class="card">
          <h1 style="margin-top:0;font-size:24px;">Login History</h1>
          <p style="color:#555;margin-bottom:16px;font-size:14px;">Recent login attempts across the platform.</p>
          <div
            id="login-history-container"
            style="border:1px solid #f0f0f5;border-radius:16px;max-height:420px;overflow-y:auto;"
          >
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Device</th>
                  <th>IP</th>
                  <th>Date / Time</th>
                </tr>
              </thead>
              <tbody
                id="login-history-body"
                data-page="1"
                data-limit="${limit}"
                data-has-more="${hasMore}"
              >
                ${data.join("")}
              </tbody>
            </table>
            <div id="login-history-loading" style="display:none;padding:12px;text-align:center;font-size:13px;color:#777;">
              Loading more...
            </div>
          </div>
        </div>
        <style>
          #login-history-container th,
          #login-history-container td {
            text-align:left;
            padding:12px 16px;
            border-bottom:1px solid #f0f0f5;
            font-size:14px;
          }
          #login-history-container th {
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
            "login-history-container",
            "login-history-body",
            "login-history-loading",
            "data"
          )}
        </script>
      `;
      res.setHeader("Content-Type", "text/html");
      res.send(
        renderAdminLayout({
          title: "Login History",
          activeId: "loginHistory",
          content,
        })
      );
    } catch (error) {
      console.error("Error rendering login history page:", error);
      res.status(500).send("Failed to load login history");
    }
  });

  return router;
};

