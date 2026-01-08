const express = require("express");
const { client: getClient } = require("../utils/xrpl");
const router = express.Router();

/**
 * GET /api/amm/price - Get REAL price from blockchain AMM
 */
router.get("/price", async (req, res) => {
  try {
    const { amountIn, token } = req.query;
    const USD_ISSUER = process.env.USD_ISSUER;
    const STK_ISSUER = process.env.STK_ISSUER;

    if (!amountIn || !token) {
      return res.status(400).json({
        success: false,
        error: "Required: amountIn, token (USD or STK)"
      });
    }

    const client = getClient();
    if (!client) {
      return res.status(503).json({
        success: false,
        error: "XRPL not connected"
      });
    }

    // Get REAL pool state from blockchain
    const ammRes = await client.request({
      command: "amm_info",
      asset: { currency: "USD", issuer: USD_ISSUER },
      asset2: { currency: "STK", issuer: STK_ISSUER },
      ledger_index: "validated"
    });

    const amm = ammRes.result.amm;
    const usdAmount = parseFloat(amm.amount.value);
    const stkAmount = parseFloat(amm.amount2.value);

    const fee = 0.003;
    const amountInParsed = parseFloat(amountIn);
    const amountInAfterFee = amountInParsed * (1 - fee);

    let amountOut, outToken, spotPrice, execPrice;

    if (token === "USD") {
      amountOut = (stkAmount * amountInAfterFee) / (usdAmount + amountInAfterFee);
      outToken = "STK";
      spotPrice = stkAmount / usdAmount;
      execPrice = amountOut / amountInParsed;
    } else {
      amountOut = (usdAmount * amountInAfterFee) / (stkAmount + amountInAfterFee);
      outToken = "USD";
      spotPrice = usdAmount / stkAmount;
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
        usd: usdAmount,
        stk: stkAmount
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
 * GET /api/amm/pool-info - Get REAL pool from blockchain
 */
router.get("/pool-info", async (req, res) => {
  try {
    const USD_ISSUER = process.env.USD_ISSUER;
    const STK_ISSUER = process.env.STK_ISSUER;

    const client = getClient();
    const ammRes = await client.request({
      command: "amm_info",
      asset: { currency: "USD", issuer: USD_ISSUER },
      asset2: { currency: "STK", issuer: STK_ISSUER },
      ledger_index: "validated"
    });

    const amm = ammRes.result.amm;
    
    res.json({
      success: true,
      pool: {
        usd: parseFloat(amm.amount.value),
        stk: parseFloat(amm.amount2.value),
        spotPrice: (parseFloat(amm.amount2.value) / parseFloat(amm.amount.value)).toFixed(6)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/amm/swap - Execute REAL blockchain swap
 */
router.post("/swap", async (req, res) => {
  try {
    const { fromToken, amount, userWallet } = req.body;
    const USD_ISSUER = process.env.USD_ISSUER;
    const STK_ISSUER = process.env.STK_ISSUER;
    const xrpl = require('xrpl');

    if (!fromToken || !amount || !userWallet) {
      return res.status(400).json({
        success: false,
        error: "Required: fromToken, amount, userWallet"
      });
    }

    const client = getClient();

    // Create Payment transaction that routes through AMM
    const payment = {
      TransactionType: "Payment",
      Account: userWallet,
      Destination: userWallet,
      Amount: {
        currency: fromToken === "USD" ? "STK" : "USD",
        issuer: fromToken === "USD" ? STK_ISSUER : USD_ISSUER,
        value: (parseFloat(amount) * 1.8).toString() // Request more to ensure fill
      },
      SendMax: {
        currency: fromToken,
        issuer: fromToken === "USD" ? USD_ISSUER : STK_ISSUER,
        value: amount.toString()
      },
      Flags: 131072 // tfPartialPayment
    };

    const wallet = xrpl.Wallet.fromSeed(process.env.STUDENT_SECRET);
    const prepared = await client.autofill(payment);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    console.log("\n🔄 AMM Swap Transaction:");
    console.log(`   Result: ${result.result.meta.TransactionResult}`);
    console.log(`   TX Hash: ${result.result.hash}`);

    if (result.result.meta.TransactionResult === "tesSUCCESS") {
      res.json({
        success: true,
        txHash: result.result.hash,
        fromToken,
        amountSwapped: amount,
        message: "Real blockchain swap completed! Pool updated on XRPL testnet."
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.result.meta.TransactionResult
      });
    }
  } catch (error) {
    console.error("Swap error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
