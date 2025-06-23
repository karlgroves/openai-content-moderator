const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

// Import middleware and routes
const { errorHandler } = require("./middleware/errorHandler");
const moderationRoutes = require("./routes/moderation");

const app = express();
const PORT = process.env.PORT || 8000;

// Global middleware
app.use(cors());
app.use(bodyParser.json());

// Request logging middleware (optional)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "openai-content-moderator"
  });
});

// API Routes
app.use("/api/moderation", moderationRoutes);

// Legacy endpoint for backward compatibility
app.post("/moderate", (req, res) => {
  // Redirect to new API endpoint
  req.url = "/api/moderation/text";
  app.handle(req, res);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Not found",
    message: `The requested endpoint ${req.path} does not exist`
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});