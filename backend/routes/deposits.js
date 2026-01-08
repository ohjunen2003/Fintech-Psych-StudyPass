const express = require("express");
const { tokenBalances } = require("./tokens");
const router = express.Router();

// In-memory deposit tracking
const deposits = {};
const DEPOSIT_AMOUNT = 0.5;
const ADMIN_WALLET = process.env.ADMIN_WALLET || "rAdminWalletAddress123";

/**
 * Hold a deposit when user books a seat
 * POST /api/deposits/hold
 * Body: { wallet, bookingId }
 */
router.post("/hold", async (req, res) => {
  const { wallet, bookingId } = req.body;

  if (!wallet || !bookingId) {
    return res.status(400).json({ error: "Missing wallet or bookingId" });
  }

  // Check user has enough tokens (booking fee already deducted)
  const currentBalance = tokenBalances[wallet] || 0;
  if (currentBalance < DEPOSIT_AMOUNT) {
    return res.status(400).json({ 
      error: "Insufficient tokens for deposit",
      required: DEPOSIT_AMOUNT,
      balance: currentBalance
    });
  }

  try {
    // Deduct deposit from user
    tokenBalances[wallet] -= DEPOSIT_AMOUNT;

    // Add to admin wallet (held temporarily)
    if (!tokenBalances[ADMIN_WALLET]) {
      tokenBalances[ADMIN_WALLET] = 0;
    }
    tokenBalances[ADMIN_WALLET] += DEPOSIT_AMOUNT;

    // Track deposit
    deposits[bookingId] = {
      wallet,
      amount: DEPOSIT_AMOUNT,
      status: "held",
      heldAt: Date.now(),
      bookingId
    };

    console.log(`💰 Deposit held: ${DEPOSIT_AMOUNT} tokens from ${wallet} for booking ${bookingId}`);

    res.json({
      success: true,
      message: `${DEPOSIT_AMOUNT} token deposit held`,
      deposit: deposits[bookingId],
      remainingBalance: tokenBalances[wallet]
    });

  } catch (error) {
    // Rollback on error
    tokenBalances[wallet] += DEPOSIT_AMOUNT;
    if (tokenBalances[ADMIN_WALLET]) {
      tokenBalances[ADMIN_WALLET] -= DEPOSIT_AMOUNT;
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * Release deposit back to user (they showed up)
 * POST /api/deposits/release
 * Body: { bookingId }
 */
router.post("/release", async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ error: "Missing bookingId" });
  }

  const deposit = deposits[bookingId];
  if (!deposit) {
    return res.status(404).json({ error: "Deposit not found" });
  }

  if (deposit.status !== "held") {
    return res.status(400).json({ 
      error: `Deposit already ${deposit.status}`,
      deposit
    });
  }

  try {
    // Return deposit from admin to user
    tokenBalances[ADMIN_WALLET] -= deposit.amount;
    tokenBalances[deposit.wallet] += deposit.amount;

    // Update deposit status
    deposit.status = "released";
    deposit.releasedAt = Date.now();

    console.log(`✅ Deposit released: ${deposit.amount} tokens returned to ${deposit.wallet}`);

    res.json({
      success: true,
      message: "Deposit refunded (user showed up)",
      deposit,
      newBalance: tokenBalances[deposit.wallet]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Forfeit deposit (user no-showed, admin keeps it)
 * POST /api/deposits/forfeit
 * Body: { bookingId }
 */
router.post("/forfeit", async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ error: "Missing bookingId" });
  }

  const deposit = deposits[bookingId];
  if (!deposit) {
    return res.status(404).json({ error: "Deposit not found" });
  }

  if (deposit.status !== "held") {
    return res.status(400).json({ 
      error: `Deposit already ${deposit.status}`,
      deposit
    });
  }

  try {
    // Deposit stays in admin wallet (already transferred during hold)
    deposit.status = "forfeited";
    deposit.forfeitedAt = Date.now();

    console.log(`❌ Deposit forfeited: ${deposit.amount} tokens kept by admin (user no-showed)`);

    res.json({
      success: true,
      message: "Deposit forfeited (user no-showed)",
      deposit,
      adminBalance: tokenBalances[ADMIN_WALLET]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get deposit status for a booking
 * GET /api/deposits/:bookingId
 */
router.get("/:bookingId", (req, res) => {
  const deposit = deposits[req.params.bookingId];
  
  if (!deposit) {
    return res.status(404).json({ error: "Deposit not found" });
  }

  res.json({
    success: true,
    deposit
  });
});

/**
 * Get all deposits for a wallet
 * GET /api/deposits/wallet/:wallet
 */
router.get("/wallet/:wallet", (req, res) => {
  const wallet = req.params.wallet;
  const userDeposits = Object.values(deposits).filter(d => d.wallet === wallet);

  res.json({
    success: true,
    wallet,
    totalDeposits: userDeposits.length,
    deposits: userDeposits
  });
});

/**
 * Get admin deposit stats
 * GET /api/deposits/admin/stats
 */
router.get("/admin/stats", (req, res) => {
  const allDeposits = Object.values(deposits);
  const held = allDeposits.filter(d => d.status === "held");
  const released = allDeposits.filter(d => d.status === "released");
  const forfeited = allDeposits.filter(d => d.status === "forfeited");

  res.json({
    success: true,
    adminWallet: ADMIN_WALLET,
    adminBalance: tokenBalances[ADMIN_WALLET] || 0,
    depositAmount: DEPOSIT_AMOUNT,
    stats: {
      total: allDeposits.length,
      held: held.length,
      released: released.length,
      forfeited: forfeited.length,
      totalHeldValue: held.length * DEPOSIT_AMOUNT,
      totalForfeitedValue: forfeited.length * DEPOSIT_AMOUNT
    }
  });
});

module.exports = { router, deposits, DEPOSIT_AMOUNT };
