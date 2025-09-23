require("dotenv").config();

const isProd = process.env.NODE_ENV === "production";

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URL: process.env.MONGO_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  API_BASE_URL: isProd
    ? "https://backend-vibecare.onrender.com"
    : "http://192.168.18.65"
};
