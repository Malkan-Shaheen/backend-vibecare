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

const formatStoryRowHtml = (story) => {
  return `
    <tr>
      <td>${story.title || "-"}</td>
      <td>${story.subtitle || "-"}</td>
      <td>${story.author || "-"}</td>
      <td>${
        story.createdAt ? new Date(story.createdAt).toLocaleString() : "N/A"
      }</td>
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
        title: entry.title,
        subtitle: entry.subtitle,
        author: entry.userId?.Email || entry.userId?.Name || "-",
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
            <div style="background:#fdf2e9;color:#cc6c10;padding:10px 16px;border-radius:30px;font-weight:600;">
              Total: ${totalStories}
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
                  <th>Created At</th>
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
                    : `<tr><td colspan="4" style="text-align:center;padding:24px;">No stories found.</td></tr>`
                }
              </tbody>
            </table>
            <div id="stories-loading" style="display:none;padding:12px;text-align:center;font-size:13px;color:#777;">
              Loading more...
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

