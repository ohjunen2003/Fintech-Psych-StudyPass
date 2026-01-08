const express = require("express");
const cors = require("cors");
const { initXRPL } = require("./utils/xrpl");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Simple request logger for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} -> ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
const authRouter = require("./routes/auth");
const { router: tokensRouter, STUDY_TOKEN_ID, ISSUER_WALLET } = require("./routes/tokens");
const seatsRouter = require("./routes/seats");
const nftRouter = require("./routes/nft");
const analyticsRouter = require("./routes/analytics");
const xrplInfoRouter = require("./routes/xrpl-info");
const ammRouter = require("./routes/amm");

app.use("/api/auth", authRouter);
app.use("/api/tokens", tokensRouter);
app.use("/api/seats", seatsRouter);
app.use("/api/nft", nftRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/xrpl", xrplInfoRouter);
app.use("/api/amm", ammRouter);

// Health check with all endpoints
app.get("/health", (req, res) => {
  res.json({
    status: "✅ StudyPass Backend Healthy",
    timestamp: new Date().toISOString(),
    xrpl: "Connected to testnet",
    version: "1.0.0",
    endpoints: {
      auth: ["POST /api/auth/login"],
      tokens: ["POST /api/tokens/mint", "GET /api/tokens/balance/:wallet"],
      seats: ["GET /api/seats/browse", "GET /api/seats/room/:roomId"],
      nft: [
        "POST /api/nft/mint",
        "GET /api/nft/verify/:nftId",
        "POST /api/nft/scan/:nftId",
        "GET /api/nft/history/:wallet"
      ],
      xrpl: ["GET /api/xrpl/balance/:address", "GET /api/xrpl/account/:address"],
      analytics: ["GET /api/analytics/dashboard"],
      amm: ["GET /api/amm/price?amountIn=100&token=USD"]
    }
  });
});

// Alias path used by some health checks/tests
app.get("/api/health", (req, res) => {
  res.redirect(307, "/health");
});

// 404 handler
// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    requestedPath: req.originalUrl,
    availableEndpoints: "/health for full API documentation"
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({ error: err.message });
});

module.exports = app;
