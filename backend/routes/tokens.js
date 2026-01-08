const express = require("express");
const { client: getClient } = require("../utils/xrpl");
const router = express.Router();

/**
 * GET /api/tokens/balance/:wallet - Get REAL USD and STK balances from blockchain
 */
router.get("/balance/:wallet", async (req, res) => {
  try {
    const wallet = req.params.wallet;
    const USD_ISSUER = process.env.USD_ISSUER;
    const STK_ISSUER = process.env.STK_ISSUER;

    console.log(`🔍 Fetching real blockchain balance for: ${wallet}`);
    console.log(`   USD Issuer: ${USD_ISSUER}`);
    console.log(`   STK Issuer: ${STK_ISSUER}`);

    const xrplClient = getClient();
    if (!xrplClient) {
      return res.status(503).json({
        success: false,
        error: "XRPL not connected"
      });
    }

    // Get account lines (trustlines with token balances)
    const response = await xrplClient.request({
      command: "account_lines",
      account: wallet,
      ledger_index: "validated"
    });

    let usdBalance = 0;
    let stkBalance = 0;

    // Parse trustlines to find USD and STK balances
    if (response.result.lines) {
      response.result.lines.forEach(line => {
        if (line.currency === "USD" && line.account === USD_ISSUER) {
          usdBalance = parseFloat(line.balance);
          console.log(`   ✅ Found USD balance: ${usdBalance}`);
        }
        if (line.currency === "STK" && line.account === STK_ISSUER) {
          stkBalance = parseFloat(line.balance);
          console.log(`   ✅ Found STK balance: ${stkBalance}`);
        }
      });
    }

    res.json({
      success: true,
      wallet: wallet,
      rlusdBalance: Math.floor(usdBalance), // Round to integer for display
      studyTokenBalance: Math.floor(stkBalance),
      balance: Math.floor(stkBalance), // For backwards compatibility
      conversionRate: 2,
      source: "XRPL Testnet Blockchain"
    });

  } catch (error) {
    console.error("❌ Balance error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      rlusdBalance: 0,
      studyTokenBalance: 0,
      balance: 0
    });
  }
});

/**
 * GET /api/tokens/balance/rlusd/:wallet - Legacy endpoint (redirects to main)
 */
router.get("/balance/rlusd/:wallet", async (req, res) => {
  try {
    const wallet = req.params.wallet;
    const USD_ISSUER = process.env.USD_ISSUER;
    const xrplClient = getClient();

    const response = await xrplClient.request({
      command: "account_lines",
      account: wallet,
      ledger_index: "validated"
    });

    let usdBalance = 0;
    if (response.result.lines) {
      response.result.lines.forEach(line => {
        if (line.currency === "USD" && line.account === USD_ISSUER) {
          usdBalance = parseFloat(line.balance);
        }
      });
    }

    res.json({
      success: true,
      wallet,
      balance: Math.floor(usdBalance),
      currency: "USD",
      source: "XRPL Testnet"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      balance: 0
    });
  }
});

/**
 * GET /api/tokens/balance/studytoken/:wallet - Legacy endpoint
 */
router.get("/balance/studytoken/:wallet", async (req, res) => {
  try {
    const wallet = req.params.wallet;
    const STK_ISSUER = process.env.STK_ISSUER;
    const xrplClient = getClient();

    const response = await xrplClient.request({
      command: "account_lines",
      account: wallet,
      ledger_index: "validated"
    });

    let stkBalance = 0;
    if (response.result.lines) {
      response.result.lines.forEach(line => {
        if (line.currency === "STK" && line.account === STK_ISSUER) {
          stkBalance = parseFloat(line.balance);
        }
      });
    }

    res.json({
      success: true,
      wallet,
      balance: Math.floor(stkBalance),
      currency: "STK",
      source: "XRPL Testnet"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      balance: 0
    });
  }
});

/**
 * POST /api/tokens/mint - Deprecated (use AMM swap)
 */
router.post("/mint", (req, res) => {
  res.status(400).json({
    success: false,
    error: "This endpoint is deprecated. Use /api/amm/swap to exchange USD for STK tokens"
  });
});

/**
 * POST /api/tokens/burn - Burn tokens (placeholder)
 */
router.post("/burn", (req, res) => {
  res.status(400).json({
    success: false,
    error: "Token burning not implemented"
  });
});

// Export router
module.exports = { router };
