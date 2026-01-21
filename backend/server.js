// Load environment variables FIRST
import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import passport from "passport";
import contactRoutes from "./routes/contact.routes.js";

// Debug: Check if env vars are loaded
console.log("🔍 ENV CHECK:");
console.log("PORT:", process.env.PORT);
console.log(
  "GOOGLE_CLIENT_ID:",
  process.env.GOOGLE_CLIENT_ID ? "Loaded" : "NOT LOADED",
);
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Loaded" : "NOT LOADED");

// Now import modules that need env vars
import connectDB from "./config/database.js";
import "./config/passport.js";
import cronJobService from "./services/cronJobService.js";

// Import routes
import authRoutes from "./routes/auth.routes.js";
import eventRoutes from "./routes/event.routes.js";
import registrationRoutes from "./routes/registration.routes.js";
import userRoutes from "./routes/user.routes.js";
import studyJamRoutes from "./routes/studyjam.routes.js";
import teamRoutes from "./routes/team.routes.js";
import certificateRoutes from "./routes/certificate.routes.js";
import codingProfileRoutes from "./routes/codingProfile.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import setupRoutes from "./routes/setup.routes.js";
import coreTeamRoutes from "./routes/coreTeam.routes.js";

// Initialize app
const app = express();

// Connect to database
connectDB();

// Initialize cron jobs
cronJobService.init();

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(morgan("dev"));

// CORS Configuration - Allow multiple origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Pragma",
      "Expires",
    ],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static("public"));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "gdg-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  }),
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/study-jams", studyJamRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/coding-profiles", codingProfileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/setup", setupRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/core-team", coreTeamRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "GDG MMMUT API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`,
  );
});

export default app;
