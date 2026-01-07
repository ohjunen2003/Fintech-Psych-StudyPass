const express = require("express");
// Remove the incorrect import line completely
const router = express.Router();

// Mock token ledger
const tokenBalances = {}; // { walletAddress: balance }

router.post("/mint", async (req, res) => {
    const { wallet, rlusdAmount } = req.body; // User sends RLUSD amount

    // In real app: verify RLUSD sent to issuer
    // For MVP: Just mint tokens based on amount
    const studyTokenAmount = parseFloat(rlusdAmount); // 1:1 conversion
    tokenBalances[wallet] = (tokenBalances[wallet] || 0) + studyTokenAmount;
    
    res.json({
        success: true,
        wallet,
        studyTokens: studyTokenAmount,
        balance: tokenBalances[wallet]
    });
});

router.get("/balance/:wallet", (req, res) => {
    const balance = tokenBalances[req.params.wallet] || 0;
    res.json({ wallet: req.params.wallet, balance });
});

router.post("/burn", (req, res) => {
    const { wallet, amount } = req.body;
    if ((tokenBalances[wallet] || 0) < amount) {
        return res.status(400).json({ error: "Insufficient tokens" });
    }

    tokenBalances[wallet] -= amount;
    res.json({
        success: true,
        burned: amount,
        remainingBalance: tokenBalances[wallet]
    });
});

// Export both router and tokenBalances for app.js
module.exports = { router, tokenBalances };