const express = require("express");

module.exports = ({ renderAdminLayout, getAnalyticsSnapshot }) => {
  const router = express.Router();

  router.get("/analytics", async (req, res) => {
    try {
      const snapshot = await getAnalyticsSnapshot();
      res.json({ status: "success", data: snapshot });
    } catch (error) {
      console.error("Error fetching analytics snapshot:", error);
      res
        .status(500)
        .json({ status: "error", message: "Failed to load analytics" });
    }
  });

  router.get("/", async (req, res) => {
    try {
      const snapshot = await getAnalyticsSnapshot();
      const {
        userCount,
        loginEntries,
        expressionEntries,
        depressionResults,
        anxietyResults,
        stressResults,
      } = snapshot;

      const chartsData = {
        totals: { userCount, loginEntries, expressionEntries },
        assessments: [
          { label: "Depression", value: depressionResults },
          { label: "Anxiety", value: anxietyResults },
          { label: "Stress", value: stressResults },
        ],
      };

      const content = `
        <div class="card">
          <h1 style="margin-top:0;font-size:24px;">Welcome back 👋</h1>
          <p style="color:#555;margin-bottom:24px;">
            Real-time snapshot of platform activity.
          </p>
          <div style="display:flex;gap:16px;flex-wrap:wrap;">
            <div style="flex:1;min-width:200px;background:#fff6f6;border-radius:16px;padding:16px;">
              <div style="color:#ff5a5f;font-size:13px;font-weight:600;">Users</div>
              <div style="font-size:28px;font-weight:700;">${userCount}</div>
            </div>
            <div style="flex:1;min-width:200px;background:#f3f0ff;border-radius:16px;padding:16px;">
              <div style="color:#6a4ce0;font-size:13px;font-weight:600;">Face detections</div>
              <div style="font-size:28px;font-weight:700;">${expressionEntries}</div>
            </div>
            <div style="flex:1;min-width:200px;background:#e6fff4;border-radius:16px;padding:16px;">
              <div style="color:#2e9b6f;font-size:13px;font-weight:600;">Login entries</div>
              <div style="font-size:28px;font-weight:700;">${loginEntries}</div>
            </div>
          </div>
        </div>
        <div class="card" style="margin-top:24px;">
          <h2 style="margin-top:0;font-size:20px;">Assessments overview</h2>
          <div style="display:flex;gap:16px;flex-wrap:wrap;">
            ${chartsData.assessments
              .map(
                (item) => `
              <div style="flex:1;min-width:160px;background:#f9fafc;border-radius:16px;padding:12px;">
                <div style="font-size:12px;color:#666;">${item.label}</div>
                <div style="font-size:22px;font-weight:700;">${item.value}</div>
              </div>`
              )
              .join("")}
          </div>
          <div style="max-width:520px;margin-top:16px;">
            <canvas id="assessmentChart" height="160"></canvas>
          </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
          const chartCtx = document.getElementById("assessmentChart");
          if (chartCtx) {
            new Chart(chartCtx, {
              type: "bar",
              data: {
                labels: ${JSON.stringify(
                  chartsData.assessments.map((a) => a.label)
                )},
                datasets: [{
                  label: "Assessments logged",
                  data: ${JSON.stringify(
                    chartsData.assessments.map((a) => a.value)
                  )},
                  backgroundColor: ["#ff8c8c", "#6a92ff", "#4dd4ac"],
                  borderRadius: 12,
                }],
              },
              options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, ticks: { precision: 0 } },
                },
              },
            });
          }
        </script>
      `;
      res.setHeader("Content-Type", "text/html");
      res.send(
        renderAdminLayout({ title: "Overview", activeId: "dashboard", content })
      );
    } catch (error) {
      console.error("Error rendering admin dashboard:", error);
      res.status(500).send("Failed to load admin dashboard");
    }
  });

  return router;
};

