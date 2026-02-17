const dotenv = require("dotenv");
dotenv.config();

module.exports = config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 8080,
  jwtSecret: process.env.JWT_SECRET || "shivam6862",
  mongoUrl:
    process.env.MONGODB_URL ||
    process.env.MONGO_HOST ||
    "mongodb://127.0.0.1:27017/smartpay",
  allowedOrigins:
    process.env.ALLOWED_ORIGINS ||
    "http://localhost:3000,http://127.0.0.1:3000",
};
