const path = require("path");
const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const config = require("./config/config");
dotenv.config();
const fileUpload = require("express-fileupload");

const app = express();

const allowedOrigins = (config.allowedOrigins || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
  methods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "AuthToken"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.static(path.join(__dirname, "uploads")));
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

routes.forEach((route) => app[route.method](route.path, route.handler));

mongoose.set("strictQuery", false);
mongoose
  .connect(config.mongoUrl)
  .then(() => {
    app.listen(config.port, () => {
      console.log(`API listening on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
