require("dotenv").config();

const isProd = process.env.NODE_ENV === "production";

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URL: process.env.MONGO_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
API_BASE_URL: isProd
    ? "http://10.110.10.86:5000"
    : "http://10.110.10.86:5000"

};
