const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cors = require("cors");

// const imagesRoutes=require('../backend/models/Images');

// Application configuration
const app = express();
app.use(express.json()); // JSON body parsing
app.use(express.urlencoded({ extended: true })); // support HTML form submissions
app.use(cors());

const {
  API_BASE_URL,
  JWT_SECRET,
  MONGO_URL,
  EMAIL_USER,
  EMAIL_PASS,
} = require("./config/config.js");

// Example usage in backend
console.log("MongoDB URL:", MONGO_URL);
console.log("JWT Secret:", JWT_SECRET);

// Use in your Express app
app.use((req, res, next) => {
  console.log("API Base URL:", API_BASE_URL);
  next();
});

// MongoDB Connection
mongoose
  .connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });

// User Schema
const UserDetailSchema = mongoose.Schema(
  {
    Name: String,
    Username: String,
    Email: { type: String, unique: true },
    Password: String,
    otp: String,
    resetToken: String,
    resetTokenExpiration: Date,
  },
  {
    collection: "Userinfo",
  }
);
const User = mongoose.model("Userinfo", UserDetailSchema);

// Default Route
app.get("/", (req, res) => {
  res.send({ status: "Started" });
});

// User Registration
app.post("/register", async (req, res) => {
  const { Name, Username, Email, Password } = req.body;

  try {
    const oldUser = await User.findOne({ Email });
    if (oldUser) {
      return res
        .status(400)
        .send({ status: "error", message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(Password, 10);

    const newUser = new User({
      Name,
      Username,
      Email,
      Password: hashedPassword,
    });

    await newUser.save();
    res.send({
      status: "success",
      message: "User registered successfully",
      userId: newUser._id,
    });
  } catch (error) {
    console.error("Error in registration:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
    console.log("User data received:", req.body); // Log the user data received
  }
});

// Add this route after your existing routes
app.get("/get-user/:userId", async (req, res) => {
  try {
    // Validate the userId parameter
    if (
      !req.params.userId ||
      !mongoose.Types.ObjectId.isValid(req.params.userId)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID format",
      });
    }

    // Find the user by ID, excluding sensitive information
    const user = await User.findById(req.params.userId).select(
      "-Password -otp -resetToken -resetTokenExpiration"
    );

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Return the user data
    res.json({
      status: "success",
      data: {
        _id: user._id,
        Name: user.Name,
        Username: user.Username,
        Email: user.Email,
        // Add other non-sensitive fields if needed
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// User Login
app.post("/login-user", async (req, res) => {
  const { Email, Password } = req.body;

  try {
    const oldUser = await User.findOne({ Email });
    if (!oldUser) {
      return res
        .status(404)
        .send({ status: "error", message: "User does not exist" });
    }

    if (await bcrypt.compare(Password, oldUser.Password)) {
      const token = jwt.sign({ Email: oldUser.Email }, JWT_SECRET, {
        expiresIn: "1h",
      });

      // ✅ Save login history
      const userAgent = req.headers["user-agent"] || "Unknown";
      const device = detectDevice(userAgent);

      const now = new Date();
      const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const time = now.toLocaleTimeString("en-US", { hour12: false }); // HH:mm:ss

      await LoginHistory.create({
        userId: oldUser._id,
        email: oldUser.Email,
        ip: req.ip,
        userAgent,
        device,
        date,
        time,
        success: true,
      });

      return res.status(200).send({
        status: "ok",
        data: token,
        userId: oldUser._id,
      });
    } else {
      return res
        .status(400)
        .send({ status: "error", message: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});

const LoginHistory = require("./models/LoginHistory"); // make sure model is imported
const FaceExpressionHistory = require("./models/FaceExpressionHistory");

const detectDevice = (ua = "") => {
  ua = ua.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone"))
    return "Mobile";
  if (ua.includes("okhttp")) return "Android App"; // since your React Native app sends this
  return "Desktop";
};

// Get login history by userId
// Get login history by userId
app.get("/get-login-history/:id", async (req, res) => {
  try {
    const history = await LoginHistory.find({ userId: req.params.id }).sort({
      createdAt: -1,
    });

    const formatted = history.map((h) => {
      // Prefer saved date/time if present
      let date = h.date || null;
      let time = h.time || null;

      // If not present, try to derive from loginAt/createdAt
      if (!date || !time) {
        const rawDate = h.loginAt || h.createdAt;
        if (rawDate) {
          const dateObj = new Date(rawDate);
          if (!isNaN(dateObj)) {
            date = date || dateObj.toISOString().split("T")[0];
            time =
              time || dateObj.toLocaleTimeString("en-US", { hour12: false });
          }
        }
      }

      return {
        date: date || "N/A",
        time: time || "N/A",
        ip: h.ip || "N/A",
        device: h.device || detectDevice(h.userAgent || ""),
      };
    });

    res.send({ status: "success", data: formatted });
  } catch (err) {
    console.error("Error fetching login history:", err);
    res.status(500).send({ status: "error", message: "Server error" });
  }
});

app.post("/save-face-expression-result", async (req, res) => {
  try {
    const { userId, result, timestamp } = req.body || {};

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ status: "error", message: "Valid userId is required" });
    }

    if (!result) {
      return res
        .status(400)
        .json({ status: "error", message: "result payload is required" });
    }

    const prediction =
      Array.isArray(result?.predictions) && result.predictions.length > 0
        ? result.predictions[0]
        : null;

    let capturedAt = new Date();
    if (timestamp) {
      const parsed = new Date(timestamp);
      if (!isNaN(parsed.getTime())) {
        capturedAt = parsed;
      }
    }

    const historyEntry = await FaceExpressionHistory.create({
      userId,
      facesDetected:
        typeof result.faces_detected === "number"
          ? result.faces_detected
          : prediction
          ? 1
          : 0,
      predictedEmotion: prediction?.predicted_emotion,
      confidence:
        typeof prediction?.confidence === "number"
          ? prediction.confidence
          : prediction?.confidence
          ? Number(prediction.confidence)
          : undefined,
      allEmotions: prediction?.all_emotions,
      boundingBox: prediction?.bounding_box,
      rawResult: result,
      capturedAt,
    });

    return res.status(201).json({ status: "success", data: historyEntry });
  } catch (error) {
    console.error("Error saving face expression result:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to save face data" });
  }
});

// ---------------- Admin Panel ----------------
const ADMIN_NAV = [
  { id: "dashboard", label: "Overview", href: "/admin" },
  { id: "users", label: "Users", href: "/admin/users" },
  { id: "loginHistory", label: "Login History", href: "/admin/login-history" },
  { id: "feedback", label: "Feedback", href: "/admin/feedback" },
  { id: "stories", label: "Success Stories", href: "/admin/stories" },
];

const renderAdminLayout = ({ title, activeId, content }) => {
  const nav = ADMIN_NAV.map((item) => {
    const active = item.id === activeId ? "active" : "";
    return `<a class="nav-item ${active}" href="${item.href}">${item.label}</a>`;
  }).join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title} • VibeCare Admin</title>
      <style>
        :root {
          --sidebar-bg: #1f1b2c;
          --accent: #ff8c8c;
          --accent-dark: #ff5a5f;
          --text-light: rgba(255,255,255,0.9);
          --text-muted: rgba(255,255,255,0.6);
          --surface: #ffffff;
          --bg: #f4f6fb;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: "Inter", "Segoe UI", Tahoma, sans-serif;
          background: var(--bg);
          color: #1e1e2f;
          min-height: 100vh;
          display: flex;
        }
        .sidebar {
          width: 240px;
          background: var(--sidebar-bg);
          color: var(--text-light);
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .brand {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .nav-item {
          color: var(--text-muted);
          text-decoration: none;
          padding: 10px 14px;
          border-radius: 10px;
          transition: all 0.2s ease;
        }
        .nav-item:hover {
          background: rgba(255,255,255,0.08);
          color: var(--text-light);
        }
        .nav-item.active {
          background: var(--accent-dark);
          color: #fff;
          box-shadow: 0 6px 20px rgba(255, 90, 95, 0.35);
        }
        .content {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
        }
        .card {
          background: var(--surface);
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(15, 14, 36, 0.08);
          padding: 24px;
        }
        @media (max-width: 960px) {
          body { flex-direction: column; }
          .sidebar {
            width: 100%;
            flex-direction: row;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
          }
          .nav {
            flex-direction: row;
            flex-wrap: wrap;
          }
          .content {
            padding: 16px;
          }
        }
      </style>
    </head>
    <body>
      <aside class="sidebar">
        <div class="brand">VibeCare Admin</div>
        <nav class="nav">
          ${nav}
        </nav>
      </aside>
      <main class="content">
        ${content}
      </main>
    </body>
    </html>
  `;
};

const getAnalyticsSnapshot = async () => {
  const [
    userCount,
    loginEntries,
    expressionEntries,
    depressionResults,
    anxietyResults,
    stressResults,
    recentUsers,
    recentExpressions,
  ] = await Promise.all([
    User.countDocuments(),
    LoginHistory.countDocuments(),
    FaceExpressionHistory.countDocuments(),
    DepressionResult.countDocuments(),
    AnxietyResult.countDocuments(),
    StressResult.countDocuments(),
    User.find().sort({ _id: -1 }).limit(5),
    FaceExpressionHistory.find()
      .sort({ capturedAt: -1, createdAt: -1 })
      .limit(5),
  ]);

  return {
    userCount,
    loginEntries,
    expressionEntries,
    depressionResults,
    anxietyResults,
    stressResults,
    recentUsers,
    recentExpressions,
  };
};

const formatUserRowHtml = (user, index) => {
  const createdAt =
    user.createdAt ||
    (user._id && user._id.getTimestamp ? user._id.getTimestamp() : null);
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleString()
    : "N/A";
  return `
    <tr onclick="window.location='/admin/users/${user._id}'">
      <td>${index}</td>
      <td>${user.Name || "-"}</td>
      <td>${user.Username || "-"}</td>
      <td>${user.Email || "-"}</td>
      <td><span class="status">${user.status || "Active"}</span></td>
      <td>${formattedDate}</td>
    </tr>
  `;
};

const fetchPaginatedUsers = async (page, limit) => {
  const skip = (page - 1) * limit;
  const records = await User.find()
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit + 1);
  const hasMore = records.length > limit;
  const sliced = hasMore ? records.slice(0, limit) : records;
  const data = sliced.map((user, idx) =>
    formatUserRowHtml(user, skip + idx + 1)
  );
  return { data, hasMore };
};

app.get("/admin/users/data", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const result = await fetchPaginatedUsers(page, limit);
    res.json({ status: "success", ...result });
  } catch (error) {
    console.error("Error loading users:", error);
    res.status(500).json({ status: "error", message: "Failed to load users" });
  }
});

app.get("/admin/users", async (req, res) => {
  try {
    const limit = 20;
    const totalUsers = await User.countDocuments();
    const { data, hasMore } = await fetchPaginatedUsers(1, limit);

    const content = `
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div>
            <h1 style="margin:0;font-size:22px;">Users</h1>
            <p style="margin:4px 0 0;color:#666;font-size:14px;">Select a user to view detailed information.</p>
          </div>
          <div style="display:flex;gap:12px;align-items:center;">
            <div style="background:#fff6f6;color:#ff5a5f;padding:10px 16px;border-radius:30px;font-weight:600;">
              Total: ${totalUsers}
            </div>
            <button id="users-refresh" style="background:#ffe3df;color:#b33951;border:none;border-radius:20px;padding:10px 18px;font-weight:600;cursor:pointer;">
              Refresh
            </button>
          </div>
        </div>
        <div
          id="users-container"
          style="overflow:auto;margin-top:24px;border:1px solid #f0f0f5;border-radius:16px;max-height:420px;"
        >
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody
              id="users-body"
              data-page="1"
              data-limit="${limit}"
              data-has-more="${hasMore}"
            >
              ${
                data.length > 0
                  ? data.join("")
                  : `<tr><td colspan="6" style="text-align:center;padding:24px;">No users found.</td></tr>`
              }
            </tbody>
          </table>
          <div id="users-loading" style="display:none;padding:12px;text-align:center;font-size:13px;color:#777;">
            Loading more...
          </div>
        </div>
      </div>
      <style>
        table th, table td {
          text-align:left;
          padding:12px 16px;
          border-bottom:1px solid #f0f0f5;
          font-size:14px;
          white-space:nowrap;
        }
        table th {
          color:#5f0f09;
          text-transform:uppercase;
          font-size:12px;
          letter-spacing:0.5px;
        }
        table tr {
          cursor:pointer;
        }
        table tr:hover td {
          background:#fff6f6;
        }
        .status {
          background:#ffe3df;
          color:#b33951;
          padding:4px 10px;
          border-radius:999px;
          font-size:12px;
          font-weight:600;
        }
      </style>
      <script>
        (function() {
          const refreshBtn = document.getElementById("users-refresh");
          if (refreshBtn) {
            refreshBtn.addEventListener("click", () => window.location.reload());
          }
        })();
        (function() {
          const container = document.getElementById("users-container");
          const tbody = document.getElementById("users-body");
          const loadingEl = document.getElementById("users-loading");
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
              const res = await fetch(\`/admin/users/data?page=\${nextPage}&limit=\${limit}\`);
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
              console.error("Failed to load more users:", err);
            } finally {
              loading = false;
              loadingEl.style.display = "none";
            }
          };

          container.addEventListener("scroll", () => {
            const threshold = container.scrollHeight - container.clientHeight - 40;
            if (container.scrollTop >= threshold) {
              loadMore();
            }
          });
        })();
      </script>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(renderAdminLayout({ title: "Users", activeId: "users", content }));
  } catch (error) {
    console.error("Error rendering admin users page:", error);
    res.status(500).send("Failed to load admin panel");
  }
});

app.get("/admin/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send(
        renderAdminLayout({
          title: "User not found",
          activeId: "users",
          content: `<div class="card"><h2>User not found</h2><p>The requested user does not exist.</p></div>`,
        })
      );
    }

    const loginCount = await LoginHistory.countDocuments({ userId: user._id });
    const expressionCount = await FaceExpressionHistory.countDocuments({
      userId: user._id,
    });
    const historyPageSize = 10;
    let expressionHistory = await FaceExpressionHistory.find({
      userId: user._id,
    })
      .sort({ capturedAt: -1, createdAt: -1 })
      .limit(historyPageSize + 1);
    const hasMoreHistory = expressionHistory.length > historyPageSize;
    if (hasMoreHistory) {
      expressionHistory = expressionHistory.slice(0, historyPageSize);
    }
    const createdAt =
      user.createdAt ||
      (user._id && user._id.getTimestamp ? user._id.getTimestamp() : null);
    const historyRows = expressionHistory
      .map((entry) => {
        const ts =
          entry.capturedAt ||
          entry.createdAt ||
          (entry._id?.getTimestamp ? entry._id.getTimestamp() : null);
        return `
          <tr>
            <td>${entry.predictedEmotion || "-"}</td>
            <td>${
              typeof entry.confidence === "number"
                ? entry.confidence.toFixed(2) + "%"
                : "-"
            }</td>
            <td>${ts ? new Date(ts).toLocaleString() : "N/A"}</td>
          </tr>
        `;
      })
      .join("");
    const content = `
      <div class="card">
        <a href="/admin/users" style="text-decoration:none;color:#ff5a5f;font-weight:600;">← Back to users</a>
        <form id="inline-edit-form" method="POST" action="/admin/users/${
          user._id
        }/edit" style="margin:0;">
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:12px;">
            <h1 style="flex:1;margin:0;font-size:26px;">
              <input
                class="inline-field"
                name="Name"
                value="${user.Name || user.Username || "User"}"
                readonly
              />
            </h1>
            <button
              type="button"
              id="inline-edit-btn"
              style="background:#ffe3df;color:#b33951;border:none;border-radius:20px;padding:10px 18px;font-weight:600;cursor:pointer;"
            >
              Edit
            </button>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:20px;margin-top:8px;">
            <div style="flex:1;min-width:240px;">
              <h3 style="margin-bottom:8px;">Basic Information</h3>
              <p style="display:flex;flex-direction:column;gap:4px;">
                <strong>Email:</strong>
                <input
                  class="inline-field"
                  type="email"
                  name="Email"
                  value="${user.Email || "-"}"
                  readonly
                />
              </p>
              <p style="display:flex;flex-direction:column;gap:4px;">
                <strong>Username:</strong>
                <input
                  class="inline-field"
                  name="Username"
                  value="${user.Username || "-"}"
                  readonly
                />
              </p>
              <div style="display:flex;gap:32px;flex-wrap:wrap;align-items:center;">
                <p style="display:flex;flex-direction:column;gap:4px;margin:0;">
                  <strong>Status:</strong>
                  <select class="inline-field" name="status" disabled>
                    <option value="Active" ${
                      user.status !== "Deactivated" ? "selected" : ""
                    }>Active</option>
                    <option value="Deactivated" ${
                      user.status === "Deactivated" ? "selected" : ""
                    }>Deactivated</option>
                  </select>
                </p>
                <p style="margin:0;"><strong>Joined:</strong> ${
                  createdAt ? new Date(createdAt).toLocaleString() : "N/A"
                }</p>
              </div>
            </div>
            <div style="flex:1;min-width:240px;">
              <h3 style="margin-bottom:8px;">Activity</h3>
              <p><strong>Login entries:</strong> ${loginCount}</p>
              <p><strong>Face expression detections:</strong> ${expressionCount}</p>
            </div>
          </div>
        </form>
         <div style="margin-top:32px;">
           <h3 style="margin-bottom:12px;">Recent Face Expression History</h3>
           ${
             expressionHistory.length === 0
               ? `<p style="color:#777;">No detections recorded for this user.</p>`
               : `
                 <div style="border:1px solid #f0f0f5;border-radius:16px;max-height:380px;overflow-y:auto;" id="history-container">
                   <table style="width:100%;border-collapse:collapse;">
                     <thead>
                       <tr>
                         <th>Emotion</th>
                         <th>Confidence</th>
                         <th>Captured At</th>
                       </tr>
                     </thead>
                     <tbody
                       id="history-body"
                       data-user-id="${user._id}"
                       data-page="1"
                       data-loading="false"
                       data-has-more="${hasMoreHistory}"
                     >
                       ${historyRows}
                     </tbody>
                   </table>
                   <div id="history-loading" style="display:none;padding:12px;text-align:center;font-size:13px;color:#777;">
                     Loading more...
                   </div>
                 </div>
               `
           }
         </div>
      </div>
      <style>
        table th, table td {
          text-align:left;
          padding:12px 16px;
          border-bottom:1px solid #f0f0f5;
          font-size:14px;
        }
        table th {
          color:#5f0f09;
          text-transform:uppercase;
          font-size:12px;
          letter-spacing:0.5px;
        }
        .inline-field {
          border:none;
          background:transparent;
          font:inherit;
          color:#1e1e2f;
          padding:4px 0;
          width:100%;
        }
        .inline-field:focus {
          outline:none;
        }
        .inline-field.editing {
          background:#fff6f6;
          border:1px solid #ffb3b3;
          border-radius:10px;
          padding:8px 10px;
        }
        .inline-field::-ms-expand {
          display: none;
        }
        .inline-field {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
        #history-container thead th {
          position:sticky;
          top:0;
          background:#fff;
          z-index:2;
        }
      </style>
       <script>
         (function() {
           const form = document.getElementById("inline-edit-form");
           const toggleBtn = document.getElementById("inline-edit-btn");
           if (!form || !toggleBtn) return;
           const fields = form.querySelectorAll(".inline-field");
           let editing = false;
           toggleBtn.addEventListener("click", () => {
             if (!editing) {
               editing = true;
               toggleBtn.textContent = "Save changes";
               fields.forEach((field) => {
                 field.classList.add("editing");
                 if (field.tagName === "SELECT") {
                   field.disabled = false;
                 } else {
                   field.readOnly = false;
                 }
               });
               fields[0].focus();
             } else {
               form.submit();
             }
           });
         })();
         (function() {
           const tableBody = document.getElementById("history-body");
           const container = document.getElementById("history-container");
           const loadingEl = document.getElementById("history-loading");
           if (!tableBody || !container || !loadingEl) return;
           const userId = tableBody.dataset.userId;
           let page = parseInt(tableBody.dataset.page, 10) || 1;
           let loading = tableBody.dataset.loading === "true";
           let hasMore = tableBody.dataset.hasMore === "true";

           const loadMore = async () => {
             if (loading || !hasMore) return;
             loading = true;
             tableBody.dataset.loading = "true";
             loadingEl.style.display = "block";
             try {
               const nextPage = page + 1;
               const res = await fetch(
                 \`/face-expression-history/\${userId}?limit=10&page=\${nextPage}\`
               );
               const data = await res.json();
               if (data?.status === "success" && Array.isArray(data.data)) {
                 data.data.forEach((entry) => {
                   const row = document.createElement("tr");
                   row.innerHTML = \`
                     <td>\${entry.predictedEmotion || "-"}</td>
                     <td>\${
                       typeof entry.confidence === "number"
                         ? entry.confidence.toFixed(2) + "%"
                         : "-"
                     }</td>
                     <td>\${
                       entry.capturedAt
                         ? new Date(entry.capturedAt).toLocaleString()
                         : entry.createdAt
                         ? new Date(entry.createdAt).toLocaleString()
                         : "N/A"
                     }</td>
                   \`;
                   tableBody.appendChild(row);
                 });
                 page = nextPage;
                 tableBody.dataset.page = String(page);
                 hasMore = Boolean(data.hasMore);
                 tableBody.dataset.hasMore = hasMore ? "true" : "false";
               } else {
                 hasMore = false;
                 tableBody.dataset.hasMore = "false";
               }
             } catch (err) {
               console.error("Failed to load more history:", err);
             } finally {
               loading = false;
               tableBody.dataset.loading = "false";
               loadingEl.style.display = "none";
             }
           };

           container.addEventListener("scroll", () => {
             const threshold = container.scrollHeight - container.clientHeight - 40;
             if (container.scrollTop >= threshold) {
               loadMore();
             }
           });
         })();
       </script>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(
      renderAdminLayout({
        title: "User details",
        activeId: "users",
        content,
      })
    );
  } catch (error) {
    console.error("Error rendering user detail page:", error);
    res.status(500).send("Failed to load user detail");
  }
});

app.post("/admin/users/:id/edit", async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, Username, Email, status } = req.body || {};

    if (!Name || !Username || !Email) {
      return res.status(400).send("Missing required fields");
    }

    await User.findByIdAndUpdate(id, {
      Name,
      Username,
      Email,
      status: status || "Active",
    });

    res.redirect(`/admin/users/${id}`);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send("Failed to update user");
  }
});

app.get("/face-expression-history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ status: "error", message: "Valid userId is required" });
    }

    const limitParam = parseInt(req.query.limit, 10);
    const pageParam = parseInt(req.query.page, 10);
    const limit = Number.isNaN(limitParam)
      ? 10
      : Math.min(Math.max(limitParam, 1), 50);
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const skip = (page - 1) * limit;

    const entries = await FaceExpressionHistory.find({ userId })
      .sort({ capturedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit + 1);

    const hasMore = entries.length > limit;
    const slicedEntries = hasMore ? entries.slice(0, limit) : entries;

    return res.json({
      status: "success",
      data: slicedEntries,
      page,
      limit,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching face expression history:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to load history" });
  }
});

const otpStore = {};

//send otp for email verification
app.post("/send-otp", async (req, res) => {
  const { Email } = req.body;
  console.log("Received email:", Email);

  try {
    // Check if user already exists
    const user = await User.findOne({ Email });
    if (user) {
      return res
        .status(400)
        .send({ status: "error", message: "Email already registered!" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[Email] = otp; // Save OTP temporarily

    // Send OTP email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "vibecare67@gmail.com",
        pass: "dmuo xfwq mxhl nzpq",
      },
    });

    const mailOptions = {
      from: "vibecare67@gmail.com",
      to: Email,
      subject: "Email Verification - VibeCare",
      text: `Your OTP is: ${otp}\n\nVerify your email to get your mental health well-being journey started.`,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error("Error sending OTP email:", error);
        return res
          .status(500)
          .send({ status: "error", message: "Failed to send OTP email" });
      }
      res.send({ status: "success", message: "OTP sent successfully" });
    });
  } catch (error) {
    console.error("Error in send-otp route:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});
app.post("/send-reset-otp", async (req, res) => {
  const { Email } = req.body;
  console.log("Received reset password request for email:", Email);

  try {
    // ⚠️ Do NOT check whether user exists here
    // Just send OTP regardless

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[Email] = otp; // Save OTP temporarily in memory

    // Send OTP email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "vibecare67@gmail.com",
        pass: "dmuo xfwq mxhl nzpq",
      },
    });

    const mailOptions = {
      from: "vibecare67@gmail.com",
      to: Email,
      subject: "Password Reset - VibeCare",
      text: `Your OTP for password reset is: ${otp}\n\nEnter this OTP in the app to proceed with resetting your password.`,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error("Error sending reset OTP email:", error);
        return res
          .status(500)
          .send({ status: "error", message: "Failed to send OTP email" });
      }
      res.send({ status: "success", message: "Reset OTP sent successfully" });
    });
  } catch (error) {
    console.error("Error in send-reset-otp route:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});

app.post("/verify-otp", (req, res) => {
  const { Email, otp } = req.body;

  if (otpStore[Email] === otp) {
    delete otpStore[Email]; // Remove used OTP
    return res.send({
      status: "success",
      message: "OTP verified successfully",
    });
  } else {
    return res
      .status(400)
      .send({ status: "error", message: "Invalid or expired OTP" });
  }
});

// Forgot Password - Generate OTP and Send via Email
app.post("/forgot-password", async (req, res) => {
  const { Email } = req.body;

  try {
    const user = await User.findOne({ Email });
    if (!user) {
      return res
        .status(404)
        .send({ status: "error", message: "Email not registered!" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ Hash OTP before saving
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    user.resetTokenExpiration = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    // Send plain OTP to email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "vibecare67@gmail.com",
        pass: "dmuo xfwq mxhl nzpq",
      },
    });

    const mailOptions = {
      from: "vibecare67@gmail.com",
      to: Email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error("Error sending email:", error);
        return res
          .status(500)
          .send({ status: "error", message: "Error sending OTP email" });
      }
      res.send({ status: "success", message: "OTP sent to your email" });
    });
  } catch (error) {
    console.error("Error in forgot-password route:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});

app.post("/verifyOtp", async (req, res) => {
  try {
    const { Email, otp } = req.body;
    console.log("🔹 Incoming verifyOtp request:", { Email, otp });

    const user = await User.findOne({ Email: Email.toLowerCase() });
    if (!user) {
      console.log("❌ No user found with email:", Email);
      return res
        .status(400)
        .json({ status: "error", message: "User not found" });
    }

    console.log("✅ User found. Stored OTP hash:", user.otp);

    const isMatch = await bcrypt.compare(otp.toString(), user.otp);
    console.log("🔍 bcrypt compare result:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ status: "error", message: "Invalid otp" });
    }

    // check expiration if you set one
    if (user.resetTokenExpiration && user.resetTokenExpiration < Date.now()) {
      console.log("⏰ OTP expired");
      return res.status(400).json({ status: "error", message: "OTP expired" });
    }

    res.json({ status: "success", message: "OTP verified" });
  } catch (err) {
    console.error("❌ Error in verifyOtp:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

// Reset Password
app.post("/reset-password", async (req, res) => {
  const { Email, newPassword } = req.body;

  console.log("🔐 [RESET PASSWORD] Request received:");
  console.log("👉 Email:", Email);
  console.log("👉 New Password:", newPassword);

  try {
    const user = await User.findOne({ Email });
    if (!user) {
      console.warn("⚠️ [RESET PASSWORD] No user found with Email:", Email);
      return res
        .status(404)
        .send({ status: "error", message: "User not found" });
    }

    console.log("✅ [RESET PASSWORD] User found:", user.Email);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("🔑 [RESET PASSWORD] Password hashed successfully");

    user.Password = hashedPassword;
    user.otp = null;
    user.resetToken = null;
    user.resetTokenExpiration = null;

    await user.save();
    console.log(
      "💾 [RESET PASSWORD] User password and OTP fields updated and saved"
    );

    res.send({ status: "success", message: "Password reset successfully" });
  } catch (error) {
    console.error("❌ [RESET PASSWORD] Internal server error:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});

const UserPreferencesSchema = new mongoose.Schema({
  userId: String,
  gender: String,
  ageGroup: String,
  relationshipStatus: String,
  livingSituation: String,
});

const UserPreferences = mongoose.model(
  "UserPreferences",
  UserPreferencesSchema
);

// API Endpoint to Save Preferences
app.post("/save-preferences", async (req, res) => {
  const { userId, gender, ageGroup, relationshipStatus, livingSituation } =
    req.body;

  try {
    const preferences = new UserPreferences({
      userId,
      gender,
      ageGroup,
      relationshipStatus,
      livingSituation,
    });

    await preferences.save();
    res.send({ status: "success", message: "Preferences saved successfully" });
  } catch (error) {
    console.error("Error saving preferences:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});

// Add this to your server code (Node.js)
app.get("/get-user-preferences", async (req, res) => {
  const { userId } = req.query;

  try {
    const preferences = await UserPreferences.findOne({ userId });
    if (!preferences) {
      return res.send({
        status: "success",
        preferences: {
          ageGroup: "",
          gender: "",
          relationshipStatus: "",
          livingSituation: "",
        },
      });
    }
    res.send({ status: "success", preferences });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});

const axios = require("axios");

app.post("/predict", async (req, res) => {
  try {
    const { features } = req.body;

    // Send data to Flask API
    const response = await axios.post(
      `${API_BASE_URL.replace("3000", "5000")}/predict`,
      {
        features: features,
      }
    );

    res.send(response.data); // Send prediction result back to client
  } catch (error) {
    console.error("Error calling Flask API:", error);
    res
      .status(500)
      .send({ status: "error", message: "Failed to get prediction" });
  }
});
// Edit Profile API
app.get("/user-profile", async (req, res) => {
  const { userId } = req.query;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
      .status(400)
      .send({ status: "error", message: "Invalid user ID" });
  }

  try {
    const user = await User.findById(userId).select("-Password");
    if (!user) {
      return res
        .status(404)
        .send({ status: "error", message: "User not found" });
    }
    res.send(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});

// Edit user profile
app.put("/edit-profile", async (req, res) => {
  const { userId, Name, Username, Email } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
      .status(400)
      .send({ status: "error", message: "Invalid user ID" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .send({ status: "error", message: "User not found" });
    }

    user.Name = Name || user.Name;
    user.Username = Username || user.Username;
    user.Email = Email || user.Email;

    await user.save();
    res.send({
      status: "success",
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});
const FeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userinfo",
      required: true,
    },
    rating: { type: Number, required: false },
    selectedImprovement: { type: String, required: false },
    feedback: { type: String, required: false },
    ticketNumber: { type: String, required: true, unique: true }, // Unique ticket ID
    adminResponse: { type: String, default: "" }, // Admin's reply
    status: { type: String, enum: ["Open", "Closed"], default: "Open" }, // Ticket status
    responded: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", FeedbackSchema);

// Route to Submit Feedback
app.post("/submit-feedback", async (req, res) => {
  try {
    const { userId, rating, selectedImprovement, feedback, ticketNumber } =
      req.body;

    if (!userId || !ticketNumber) {
      return res
        .status(400)
        .json({ message: "User ID and Ticket Number are required" });
    }

    const newFeedback = new Feedback({
      userId,
      rating,
      selectedImprovement,
      feedback,
      ticketNumber,
    });

    await newFeedback.save();

    res
      .status(201)
      .json({ message: "Feedback submitted successfully", ticketNumber });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all open feedback tickets
app.get("/tickets", async (req, res) => {
  try {
    const tickets = await Feedback.find({ status: "Open" }).populate(
      "userId",
      "email"
    );
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin responds to a ticket
app.post("/respond/:ticketNumber", async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const { adminResponse } = req.body;

    if (!adminResponse) {
      return res.status(400).json({ message: "Response is required" });
    }

    const ticket = await Feedback.findOne({ ticketNumber });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.adminResponse = adminResponse;
    ticket.status = "Closed";
    ticket.responded = true; // Add this line
    await ticket.save();

    res.status(200).json({ message: "Response saved successfully", ticket });
  } catch (error) {
    console.error("Error responding to ticket:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route to Fetch All Feedbacks
app.get("/feedbacks", async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error("❌ Error fetching feedbacks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/feedbacks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Feedback.findByIdAndDelete(id);
    res.status(200).json({ message: "Feedback deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update feedback with admin response
app.put("/feedbacks/:id/response", async (req, res) => {
  const { response } = req.body;
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { response, responded: true },
      { new: true }
    );
    if (!feedback) {
      return res
        .status(404)
        .send({ status: "error", message: "Feedback not found" });
    }
    res.send({
      status: "success",
      message: "Response submitted successfully",
      feedback,
    });
  } catch (error) {
    console.error("Error submitting response:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});
app.get("/feedback-status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid user ID" });
    }

    // Find the latest feedback entry for this user
    const feedback = await Feedback.findOne({ userId }).sort({ createdAt: -1 });

    if (!feedback) {
      return res
        .status(404)
        .json({ status: "error", message: "No feedback found for this user" });
    }

    res.json({ status: "success", feedback });
  } catch (error) {
    console.error("Error fetching feedback status:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});
app.put("/feedbacks/:id/respond", async (req, res) => {
  try {
    const updatedFeedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status: "Closed", responded: true }, // Ensure your schema has a "status" field
      { new: true }
    );
    if (!updatedFeedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }
    res.json(updatedFeedback);
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Success Story Schema
const SuccessStorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Userinfo",
    required: true,
  }, // Reference to the user who posted the story
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  story: { type: String, required: true }, // Full story content
  createdAt: { type: Date, default: Date.now }, // Timestamp
});

const SuccessStory = mongoose.model("SuccessStory", SuccessStorySchema);
const createAdminOverviewRouter = require("./routes/admin/overview");
const createAdminLoginHistoryRouter = require("./routes/admin/loginHistory");
const createAdminFeedbackRouter = require("./routes/admin/feedback");
const createAdminStoriesRouter = require("./routes/admin/stories");

app.use(
  "/admin",
  createAdminOverviewRouter({
    renderAdminLayout,
    getAnalyticsSnapshot,
  })
);
app.use(
  "/admin/login-history",
  createAdminLoginHistoryRouter({
    renderAdminLayout,
    LoginHistory,
  })
);
app.use(
  "/admin/feedback",
  createAdminFeedbackRouter({
    renderAdminLayout,
    Feedback,
  })
);
app.use(
  "/admin/stories",
  createAdminStoriesRouter({
    renderAdminLayout,
    SuccessStory,
    User,
  })
);

app.get("/success-stories", async (req, res) => {
  try {
    const stories = await SuccessStory.find().sort({ createdAt: -1 }); // Fetch all stories sorted by date
    res.status(200).json(stories);
  } catch (error) {
    console.error("Error fetching stories:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/success-stories", async (req, res) => {
  try {
    const { userId, title, subtitle, story } = req.body;

    if (!userId || !title || !subtitle || !story) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newStory = new SuccessStory({
      userId,
      title,
      subtitle,
      story,
    });

    await newStory.save();
    res
      .status(201)
      .json({ message: "Story added successfully", story: newStory });
  } catch (error) {
    console.error("Error adding story:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/success-stories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await SuccessStory.findByIdAndDelete(id);
    res.status(200).json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("Error deleting story:", error);
    res.status(500).json({ message: "Server error" });
  }
});

const DiaryEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the user
  note: { type: String, required: true }, // Diary note content
  createdAt: { type: Date, default: Date.now }, // Timestamp
});

const DiaryEntry = mongoose.model("DiaryEntry", DiaryEntrySchema);

app.post("/diary", async (req, res) => {
  try {
    const { userId, note } = req.body;

    if (!userId || !note) {
      return res.status(400).json({ message: "User ID and note are required" });
    }

    const newEntry = new DiaryEntry({ userId, note });
    await newEntry.save();

    res
      .status(201)
      .json({ message: "Diary entry saved successfully", entry: newEntry });
  } catch (error) {
    console.error("Error saving diary entry:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/diary", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const entries = await DiaryEntry.find({ userId }).sort({ createdAt: -1 }); // Fetch entries sorted by date
    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching diary entries:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/diary/:id", async (req, res) => {
  try {
    const { id } = req.params; // Get entry ID from the URL

    const deletedEntry = await DiaryEntry.findByIdAndDelete(id);

    if (!deletedEntry) {
      return res.status(404).json({ message: "Diary entry not found" });
    }

    res.status(200).json({ message: "Diary entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting diary entry:", error);
    res.status(500).json({ message: "Server error" });
  }
});

const Image = require("./models/Images"); // Ensure correct path if placed elsewhere

// API to get 5 random images
app.get("/random-images", async (req, res) => {
  try {
    const randomImages = await Image.aggregate([
      { $sample: { size: 5 } }, // Pick 5 random documents
    ]);

    // Remove the duplicate response and use the correct variable name
    res.status(200).json({
      status: "success",
      data: randomImages,
    });
  } catch (error) {
    console.error("Error fetching random images:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

app.get("/image-details/:id", async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res
        .status(404)
        .json({ success: false, message: "Image not found" });
    }
    res.json({ success: true, data: image });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

const emojiRoutes = require("./routes/emojis");
app.use(emojiRoutes);

app.get("/searchEmoji", async (req, res) => {
  try {
    const inputEmoji = req.query.q?.trim();
    if (!inputEmoji) {
      return res.status(400).json({ error: "Emoji is required as query" });
    }

    const data = await EmojiData.findOne(); // Assuming the full emoji object is in one document

    if (!data) return res.status(404).json({ error: "Emoji data not found" });

    for (const categoryObj of data.categories) {
      for (const subcat of categoryObj.subcategories) {
        for (const emoji of subcat.emojis) {
          if (emoji.emoji === inputEmoji) {
            return res.json({
              category: categoryObj.category,
              subcategory: subcat.subcategory,
              emojiData: emoji,
            });
          }
        }
      }
    }

    res.status(404).json({ error: "Emoji not found" });
  } catch (err) {
    console.error("Emoji search failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const CaretakerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userinfo",
      required: true,
    },
    caretakerName: { type: String, required: true },
    caretakerOtp: { type: String, required: true },
  },
  {
    collection: "Caretakers",
    timestamps: true,
  }
);

const Caretaker = mongoose.model("Caretaker", CaretakerSchema);
app.post("/add-caretaker", async (req, res) => {
  const { userId, caretakerName, caretakerOtp } = req.body;

  if (!userId || !caretakerName || !caretakerOtp) {
    return res
      .status(400)
      .send({ status: "error", message: "Missing required fields" });
  }

  try {
    // 🔍 Check if caretaker with same name already exists for this user
    const existingCaretaker = await Caretaker.findOne({
      userId,
      caretakerName: caretakerName.trim().toLowerCase(),
    });

    if (existingCaretaker) {
      return res.status(400).send({
        status: "error",
        message: "Caretaker name must be unique for this user",
      });
    }

    // Save caretaker
    const caretaker = new Caretaker({
      userId,
      caretakerName: caretakerName.trim(),
      caretakerOtp,
    });

    await caretaker.save();

    res.send({
      status: "success",
      message: "Caretaker added successfully",
    });
  } catch (error) {
    console.error("Error saving caretaker:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});
app.delete("/delete-caretaker/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const caretaker = await Caretaker.findByIdAndDelete(id);

    if (!caretaker) {
      return res
        .status(404)
        .send({ status: "error", message: "Caretaker not found" });
    }

    res.send({ status: "success", message: "Caretaker deleted successfully" });
  } catch (error) {
    console.error("Error deleting caretaker:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});

app.get("/get-caretakers", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res
      .status(400)
      .send({ status: "error", message: "userId is required" });
  }

  try {
    const caretakers = await Caretaker.find({ userId });
    res.send({ status: "success", caretakers });
  } catch (error) {
    console.error("Error fetching caretakers:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});

// POST /verify-caretaker
// Verify caretaker login
app.post("/verify-caretaker", async (req, res) => {
  const { name, otp } = req.body;

  try {
    const caretaker = await Caretaker.findOne({
      caretakerName: name,
      caretakerOtp: otp,
    });

    if (caretaker) {
      console.log("✅ Caretaker Verified:");
      console.log("Caretaker ID:", caretaker._id);
      console.log("Linked User ID:", caretaker.userId);

      res.json({
        status: "success",
        caretakerId: caretaker._id,
        userId: caretaker.userId, // include userId in response
      });
    } else {
      res.status(401).json({ status: "error", message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

// Fetch user by caretaker
app.get("/get-user-by-caretaker", async (req, res) => {
  const { caretakerId } = req.query;

  if (!caretakerId) {
    return res
      .status(400)
      .send({ status: "error", message: "caretakerId is required" });
  }

  try {
    const caretaker = await Caretaker.findById(caretakerId);
    if (!caretaker) {
      return res
        .status(404)
        .send({ status: "error", message: "Caretaker not found" });
    }

    const user = await User.findById(caretaker.userId);
    if (!user) {
      return res
        .status(404)
        .send({ status: "error", message: "User not found" });
    }

    console.log("✅ Fetching User by Caretaker:");
    console.log("Caretaker ID:", caretaker._id);
    console.log("User ID:", user._id);

    res.send({
      status: "success",
      caretakerId: caretaker._id,
      user: {
        id: user._id,
        name: user.Name,
        username: user.Username,
      },
    });
  } catch (error) {
    console.error("Error fetching user by caretaker:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});

const DepressionResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userinfo",
      required: true,
    },
    bdi_score: { type: Number, required: true },
    depression_level: { type: String, required: true },
  },
  {
    collection: "DepressionResults",
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

const DepressionResult = mongoose.model(
  "DepressionResult",
  DepressionResultSchema
);

// POST /depression-result - Save result
app.post("/depression-result", async (req, res) => {
  const { userId, bdi_score, depression_level } = req.body;

  if (!userId || bdi_score == null || !depression_level) {
    return res
      .status(400)
      .send({ status: "error", message: "Missing required fields" });
  }

  try {
    const result = new DepressionResult({
      userId,
      bdi_score,
      depression_level,
    });

    await result.save();
    res.send({ status: "success", message: "Result saved successfully" });
  } catch (error) {
    console.error("Error saving depression result:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});

// GET /get-latest-result?userId=...
app.get("/get-latest-result", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res
      .status(400)
      .send({ status: "error", message: "userId is required" });
  }

  try {
    const latestResult = await DepressionResult.findOne({ userId }).sort({
      createdAt: -1,
    });

    if (!latestResult) {
      return res
        .status(404)
        .send({ status: "error", message: "No result found" });
    }

    res.send({ status: "success", result: latestResult });
  } catch (error) {
    console.error("Error fetching latest result:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});

const AnxietyResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userinfo",
      required: true,
    },
    bai_score: { type: Number, required: true },
    anxiety_level: { type: String, required: true },
  },
  {
    collection: "AnxietyResults",
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

const AnxietyResult = mongoose.model("AnxietyResult", AnxietyResultSchema);

app.post("/anxiety-result", async (req, res) => {
  const { userId, bai_score, anxiety_level } = req.body;

  if (!userId || bai_score == null || !anxiety_level) {
    return res
      .status(400)
      .send({ status: "error", message: "Missing required fields" });
  }

  try {
    const result = new AnxietyResult({
      userId,
      bai_score,
      anxiety_level,
    });

    await result.save();
    res.send({ status: "success", message: "Result saved successfully" });
  } catch (error) {
    console.error("Error saving anxiety result:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});

// GET /get-latest-result?userId=...
app.get("/get-latest-anxiety-result", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res
      .status(400)
      .send({ status: "error", message: "userId is required" });
  }

  try {
    const latestAnxietyResult = await AnxietyResult.findOne({ userId }).sort({
      createdAt: -1,
    });

    if (!latestAnxietyResult) {
      // Fixed typo here (was latestAnnxietyResult)
      return res
        .status(404)
        .send({ status: "error", message: "No result found" });
    }

    res.send({
      status: "success",
      result: {
        bai_score: latestAnxietyResult.bai_score,
        anxiety_level: latestAnxietyResult.anxiety_level,
      },
    });
  } catch (error) {
    console.error("Error fetching latest result:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});
const StressResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userinfo",
      required: true,
    },
    stress_level: { type: String, required: true },
  },
  {
    collection: "StressResults",
    timestamps: true,
  }
);

const StressResult = mongoose.model("StressResult", StressResultSchema);

app.post("/stress-result", async (req, res) => {
  const { userId, stress_level } = req.body;

  // More thorough validation
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
      .status(400)
      .send({ status: "error", message: "Invalid userId format" });
  }

  if (!stress_level || typeof stress_level !== "string") {
    return res
      .status(400)
      .send({ status: "error", message: "stress_level must be a string" });
  }

  try {
    const result = new StressResult({
      userId,
      stress_level: stress_level.trim(), // Clean up string
    });
    await result.save();
    res.send({
      status: "success",
      message: "Stress result saved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error saving stress result:", error);
    res.status(500).send({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});

// GET latest stress result
app.get("/stress-result/latest/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const latest = await StressResult.findOne({ userId }).sort({
      createdAt: -1,
    });
    if (!latest)
      return res
        .status(404)
        .send({ status: "error", message: "No result found" });
    res.send({ status: "success", data: latest });
  } catch (error) {
    console.error("Error fetching stress result:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});

// Chat Schema
const ChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userinfo",
      required: true,
    },
    messages: [
      {
        text: { type: String, required: true },
        sender: {
          type: String,
          required: true,
          enum: ["user", "bot"], // Only allows 'user' or 'bot'
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    collection: "Chats",
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

const Chat = mongoose.model("Chat", ChatSchema);

// API Endpoints
app.post("/save-chat", async (req, res) => {
  const { userId, messages } = req.body;

  if (!userId || !messages) {
    return res.status(400).send({
      status: "error",
      message: "Missing required fields (userId or messages)",
    });
  }

  try {
    // Validate each message in the array
    for (const message of messages) {
      if (!message.text || !message.sender) {
        return res.status(400).send({
          status: "error",
          message: "Each message must have text and sender",
        });
      }
    }

    const newChat = new Chat({
      userId,
      messages,
    });

    await newChat.save();
    res.send({
      status: "success",
      message: "Chat saved successfully",
      chatId: newChat._id,
    });
  } catch (error) {
    console.error("Error saving chat:", error);
    res.status(500).send({
      status: "error",
      message: "Internal server error",
    });
  }
});

app.get("/get-chats", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).send({
      status: "error",
      message: "userId is required",
    });
  }

  try {
    const chats = await Chat.find({ userId })
      .sort({ createdAt: -1 }) // Most recent first
      .limit(50); // Limit to 50 most recent chats

    res.send({
      status: "success",
      chats,
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).send({
      status: "error",
      message: "Internal server error",
    });
  }
});
// Add this to your backend routes
app.delete("/delete-chats", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID",
      });
    }

    const result = await Chat.deleteMany({ userId });

    res.json({
      status: "success",
      message: "Chat history deleted",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting chats:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

app.get("/get-all-chats", async (req, res) => {
  try {
    const chats = await Chat.find().sort({ createdAt: -1 }).limit(500);

    res.send({
      status: "success",
      chats,
    });
  } catch (error) {
    console.error("Error fetching all chats:", error);
    res.status(500).send({
      status: "error",
      message: "Internal server error",
    });
  }
});

// New API to get chats of a specific user
app.get("/get-user-chats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send({
        status: "error",
        message: "Invalid userId format",
      });
    }

    const chats = await Chat.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .limit(500);

    res.send({
      status: "success",
      chats,
    });
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).send({
      status: "error",
      message: "Internal server error",
    });
  }
});

// GET /mental-health-summary/:userId
app.get("/mental-health-summary/:userId", async (req, res) => {
  try {
    const [depression, anxiety, stress] = await Promise.all([
      DepressionResult.findOne({ userId: req.params.userId }).sort({
        createdAt: -1,
      }),
      AnxietyResult.findOne({ userId: req.params.userId }).sort({
        createdAt: -1,
      }),
      StressResult.findOne({ userId: req.params.userId }).sort({
        createdAt: -1,
      }),
    ]);

    res.json({
      status: "success",
      data: {
        depression: depression ? depression.depression_level : "No data",
        anxiety: anxiety ? anxiety.anxiety_level : "No data",
        stress: stress ? stress.stress_level : "No data",
        // Include dates if needed
        depressionDate: depression?.createdAt,
        anxietyDate: anxiety?.createdAt,
        stressDate: stress?.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});
// GET /mental-health-history/:userId
app.get("/mental-health-history/:userId", async (req, res) => {
  try {
    res.json({ status: "success", data: [] });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/get-all-users", async (req, res) => {
  try {
    const users = await User.find()
      .select("-Password -otp -resetToken -resetTokenExpiration")
      .sort({ _id: -1 }); // newest first
    res.json({ status: "success", data: users });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

app.delete("/delete-user/:userId", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    res.json({ status: "success", message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});
app.patch("/deactivate-user/:userId", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, { status: "Deactivated" });
    res.json({ status: "success", message: "User deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// Start Server
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Node.js server started on port ${PORT}`);
});
