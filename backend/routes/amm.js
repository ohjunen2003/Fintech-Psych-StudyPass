const express = require("express");
const { client: getClient } = require("../utils/xrpl");
const router = express.Router();

// Simple in-memory pool state (starts from your AMM)
let virtualPool = {
  usd: 250,
  stk: 500
};

/**
 * GET /api/amm/price - Calculate price using AMM formula
 */
router.get("/price", async (req, res) => {
  try {
    const { amountIn, token } = req.query;

    if (!amountIn || !token) {
      return res.status(400).json({
        success: false,
        error: "Required: amountIn, token (USD or STK)"
      });
    }

    const fee = 0.003;
    const amountInParsed = parseFloat(amountIn);
    const amountInAfterFee = amountInParsed * (1 - fee);

    let amountOut, outToken, spotPrice, execPrice;

    if (token === "USD") {
      amountOut = (virtualPool.stk * amountInAfterFee) / (virtualPool.usd + amountInAfterFee);
      outToken = "STK";
      spotPrice = virtualPool.stk / virtualPool.usd;
      execPrice = amountOut / amountInParsed;
    } else {
      amountOut = (virtualPool.usd * amountInAfterFee) / (virtualPool.stk + amountInAfterFee);
      outToken = "USD";
      spotPrice = virtualPool.usd / virtualPool.stk;
      execPrice = amountOut / amountInParsed;
    }

    const priceImpact = ((spotPrice - execPrice) / spotPrice) * 100;

    res.json({
      success: true,
      input: { amount: amountInParsed, token },
      output: { amount: Math.floor(amountOut * 1e6) / 1e6, token: outToken },
      pricing: {
        spotPrice: spotPrice.toFixed(6),
        executionPrice: execPrice.toFixed(6),
        priceImpact: priceImpact.toFixed(2) + "%"
      },
      pool: {
        usd: virtualPool.usd,
        stk: virtualPool.stk
      }
    });
  } catch (error) {
    console.error("Price error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/amm/pool-info - View pool state
 */
router.get("/pool-info", async (req, res) => {
  res.json({
    success: true,
    pool: {
      usd: virtualPool.usd,
      stk: virtualPool.stk,
      spotPrice: (virtualPool.stk / virtualPool.usd).toFixed(6)
    }
  });
});

/**
 * POST /api/amm/swap - Execute swap (updates virtual pool)
 */
router.post("/swap", async (req, res) => {
  try {
    const { fromToken, amount } = req.body;

    if (!fromToken || !amount) {
      return res.status(400).json({
        success: false,
        error: "Required: fromToken, amount"
      });
    }

    const fee = 0.003;
    const amountInParsed = parseFloat(amount);
    const amountInAfterFee = amountInParsed * (1 - fee);

    let amountOut;

    if (fromToken === "USD") {
      // USD in → STK out
      amountOut = (virtualPool.stk * amountInAfterFee) / (virtualPool.usd + amountInAfterFee);
      virtualPool.usd += amountInParsed;
      virtualPool.stk -= amountOut;
    } else {
      // STK in → USD out
      amountOut = (virtualPool.usd * amountInAfterFee) / (virtualPool.stk + amountInAfterFee);
      virtualPool.stk += amountInParsed;
      virtualPool.usd -= amountOut;
    }

    console.log(`✅ Swap executed: ${amountInParsed} ${fromToken} → ${amountOut.toFixed(2)} ${fromToken === "USD" ? "STK" : "USD"}`);
    console.log(`   New pool: USD=${virtualPool.usd.toFixed(2)}, STK=${virtualPool.stk.toFixed(2)}`);

    res.json({
      success: true,
      txHash: "simulated-" + Date.now(),
      fromToken,
      amountSwapped: amountInParsed,
      amountReceived: amountOut,
      newPool: {
        usd: virtualPool.usd,
        stk: virtualPool.stk
      }
    });
  } catch (error) {
    console.error("Swap error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
