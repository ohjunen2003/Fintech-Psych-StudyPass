const express = require("express");
const { mintSeatNFT, getNFT, verifyNFT, markNFTAsUsed } = require("../utils/nftMinter");
const { tokenBalances } = require("./tokens");
const { roomsDB } = require("../models/Seat");
const { DEPOSIT_AMOUNT } = require("./deposits");
const router = express.Router();

router.post("/mint", async (req, res) => {
  const { wallet, roomId, durationMinutes, tokensToSpend, includeDeposit = true } = req.body;

  // Validation
  if (!wallet || !roomId || !durationMinutes || !tokensToSpend) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Calculate total cost (booking fee + deposit)
  const totalCost = includeDeposit ? tokensToSpend + DEPOSIT_AMOUNT : tokensToSpend;

  // Check token balance
  const currentBalance = tokenBalances[wallet] || 0;
  if (currentBalance < totalCost) {
    return res.status(400).json({ 
      error: "Insufficient tokens",
      required: totalCost,
      bookingFee: tokensToSpend,
      deposit: includeDeposit ? DEPOSIT_AMOUNT : 0,
      balance: currentBalance
    });
  }

  // Get room info
  const room = roomsDB[roomId];
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  // Check availability
  if (room.occupiedSeats >= room.totalSeats) {
    return res.status(400).json({ error: "Room is full" });
  }

  try {
    // 🔥 BURN StudyTokens for booking fee
    console.log(`🔥 Burning ${tokensToSpend} StudyTokens from ${wallet}`);
    tokenBalances[wallet] -= tokensToSpend;

    // 💰 Hold deposit if enabled
    let depositHeld = false;
    const ADMIN_WALLET = process.env.ADMIN_WALLET || "rAdminWalletAddress123";
    
    if (includeDeposit) {
      tokenBalances[wallet] -= DEPOSIT_AMOUNT;
      if (!tokenBalances[ADMIN_WALLET]) {
        tokenBalances[ADMIN_WALLET] = 0;
      }
      tokenBalances[ADMIN_WALLET] += DEPOSIT_AMOUNT;
      depositHeld = true;
      console.log(`💰 Holding ${DEPOSIT_AMOUNT} token deposit from ${wallet}`);
    }

    // ⚡ MINT NFT Seat Pass (1:1 exchange)
    const seatData = {
      roomId,
      roomName: room.name,
      durationMinutes,
      tokensUsed: tokensToSpend,
      bookedAt: Date.now(),
      depositHeld: depositHeld,
      depositAmount: depositHeld ? DEPOSIT_AMOUNT : 0
    };

    const nftResult = await mintSeatNFT(wallet, seatData);

    if (nftResult.success) {
      // Update room occupancy (simulate booking)
      room.occupiedSeats += 1;

      // Track deposit if held
      if (depositHeld) {
        const { deposits } = require("./deposits");
        deposits[nftResult.nftId] = {
          wallet,
          amount: DEPOSIT_AMOUNT,
          status: "held",
          heldAt: Date.now(),
          bookingId: nftResult.nftId
        };
      }

      res.json({
        success: true,
        nft: nftResult,
        tokensBurned: tokensToSpend,
        depositHeld: depositHeld,
        depositAmount: depositHeld ? DEPOSIT_AMOUNT : 0,
        remainingBalance: tokenBalances[wallet],
        room: {
          name: room.name,
          newOccupancy: Math.round((room.occupiedSeats / room.totalSeats) * 100)
        }
      });
    } else {
      // Refund tokens AND deposit if NFT minting failed
      tokenBalances[wallet] += tokensToSpend;
      if (depositHeld) {
        tokenBalances[wallet] += DEPOSIT_AMOUNT;
        tokenBalances[ADMIN_WALLET] -= DEPOSIT_AMOUNT;
      }
      res.status(500).json({ error: nftResult.error });
    }
  } catch (error) {
    // Refund tokens AND deposit on error
    tokenBalances[wallet] += tokensToSpend;
    if (includeDeposit) {
      tokenBalances[wallet] += DEPOSIT_AMOUNT;
      if (tokenBalances[ADMIN_WALLET]) {
        tokenBalances[ADMIN_WALLET] -= DEPOSIT_AMOUNT;
      }
    }
    res.status(500).json({ error: error.message });
  }
});

router.get("/verify/:nftId", (req, res) => {
  const nftId = req.params.nftId;
  const verification = verifyNFT(nftId);

  if (!verification.valid) {
    return res.status(400).json({
      success: false,
      error: verification.reason,
      nftId
    });
  }

  const nft = verification.nft;
  res.json({
    success: true,
    message: "✅ NFT is valid",
    nft: {
      id: nft.nftId,
      room: nft.roomName,
      duration: `${nft.duration} minutes`,
      expiresAt: new Date(nft.expiresAt).toISOString(),
      timeRemaining: Math.max(0, nft.expiresAt - Date.now())
    }
  });
});

router.post("/scan/:nftId", (req, res) => {
  const nftId = req.params.nftId;
  const verification = verifyNFT(nftId);

  if (!verification.valid) {
    return res.status(400).json({
      success: false,
      error: `Access Denied: ${verification.reason}`,
      nftId
    });
  }

  // Mark as used
  const marked = markNFTAsUsed(nftId);
  if (!marked) {
    return res.status(500).json({ 
      success: false, 
      error: "Failed to mark NFT as used" 
    });
  }

  const nft = verification.nft;

  // ✅ RELEASE DEPOSIT (User showed up!)
  const { deposits } = require("./deposits");
  const deposit = deposits[nftId];
  let depositRefunded = false;

  if (deposit && deposit.status === "held") {
    const ADMIN_WALLET = process.env.ADMIN_WALLET || "rAdminWalletAddress123";
    
    // Return deposit from admin to user
    tokenBalances[ADMIN_WALLET] -= deposit.amount;
    tokenBalances[nft.studentWallet] += deposit.amount;
    
    deposit.status = "released";
    deposit.releasedAt = Date.now();
    depositRefunded = true;
    
    console.log(`✅ Deposit released: ${deposit.amount} tokens returned to ${nft.studentWallet}`);
  }

  res.json({
    success: true,
    message: "🎉 Access Granted!",
    depositRefunded,
    details: {
      room: nft.roomName,
      student: nft.studentWallet.substring(0, 10) + "...",
      validUntil: new Date(nft.expiresAt).toLocaleTimeString(),
      scannedAt: new Date().toLocaleTimeString(),
      depositReturned: depositRefunded ? deposit.amount : 0
    }
  });
});

router.get("/history/:wallet", (req, res) => {
  const wallet = req.params.wallet;
  const { getStudentBookings, mintedNFTs } = require("../utils/nftMinter");
  
  const bookingIds = getStudentBookings(wallet);
  const bookings = bookingIds.map(id => mintedNFTs[id]).filter(Boolean);

  res.json({
    success: true,
    wallet,
    totalBookings: bookings.length,
    bookings: bookings.map(nft => ({
      id: nft.nftId,
      room: nft.roomName,
      date: new Date(nft.bookedAt).toLocaleDateString(),
      duration: `${nft.duration}min`,
      status: nft.status,
      tokensSpent: nft.tokensSpent
    }))
  });
});

// Add the /user/:wallet route that the frontend expects
router.get("/user/:wallet", (req, res) => {
  const wallet = req.params.wallet;
  const { getStudentBookings, mintedNFTs } = require("../utils/nftMinter");
  
  const bookingIds = getStudentBookings(wallet);
  const bookings = bookingIds.map(id => mintedNFTs[id]).filter(Boolean);

  res.json({
    success: true,
    wallet,
    totalBookings: bookings.length,
    bookings: bookings.map(nft => ({
      nftId: nft.nftId,
      id: nft.nftId,
      room: nft.roomName,
      roomName: nft.roomName,
      date: new Date(nft.bookedAt).toLocaleDateString(),
      bookedAt: nft.bookedAt,
      duration: `${nft.duration}min`,
      status: nft.status,
      tokensSpent: nft.tokensSpent,
      expiresAt: nft.expiresAt
    }))
  });
});

module.exports = router;
router.post("/mint", (req, res) => {
  const { wallet, room, durationHours } = req.body;
  if (!wallet || !room || !durationHours) {
    return res.status(400).json({ error: "wallet, room and durationHours required" });
  }

  const id = `nft_${Date.now()}`;
  const now = Date.now();
  const expiresAt = now + durationHours * 60 * 60 * 1000;

  const nft = { id, wallet, room, durationHours, mintedAt: now, expiresAt, used: false };
  mintedNFTs.push(nft);

  res.json({ success: true, nft });
});

// Get NFT by id
router.get("/:id", (req, res) => {
  const nft = mintedNFTs.find((n) => n.id === req.params.id);
  if (!nft) return res.status(404).json({ error: "NFT not found" });
  res.json({ nft });
});

// Verify (scan) NFT for entry: simple ownership + expiry check
router.post("/verify", (req, res) => {
  const { id, wallet } = req.body;
  const nft = mintedNFTs.find((n) => n.id === id);
  if (!nft) return res.status(404).json({ error: "NFT not found" });

  if (nft.wallet !== wallet) return res.status(403).json({ error: "Wallet does not own this NFT" });
  if (Date.now() > nft.expiresAt) return res.status(410).json({ error: "NFT expired" });
  if (nft.used) return res.status(409).json({ error: "NFT already used" });

  // Mark as used (simple check-in)
  nft.used = true;
  res.json({ success: true, message: "Access granted", nft });
});

// List minted NFTs (admin/debug)
router.get("/", (req, res) => {
  res.json({ count: mintedNFTs.length, mintedNFTs });
});

module.exports = router;