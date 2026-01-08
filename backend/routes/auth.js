const express = require("express");
const router = express.Router();

// Mock NUS matric → DID + XRPL Wallet mapping
const studentDIDMap = {
  "A1234567Z": {
    did: "did:xrpl:rNUSstudent001xTp9",
    wallet: process.env.STUDENT_WALLET || "rEiB2QW6WYukuPBmDv2EDZzGAy6B7LdWeq"
  },
  "A7654321Z": {
    did: "did:xrpl:rNUSstudent002yUq0", 
    wallet: "rTestStudent002"
  },
  "A1111111A": {
    did: "did:xrpl:rNUSstudent003zVr1",
    wallet: "rTestStudent003"
  }
};

router.post("/login", (req, res) => {
  const { matricId, signature, publicKey } = req.body;

  if (!matricId) {
    return res.status(400).json({ error: "Missing matricId" });
  }

  // Verify matric exists
  const studentData = studentDIDMap[matricId];
  if (!studentData) {
    return res.status(401).json({ error: "Invalid NUS matric ID" });
  }

  // Mock signature verification (real app uses wallet signature)
  const isSignatureValid = true;

  if (!isSignatureValid) {
    return res.status(401).json({ error: "Invalid wallet signature" });
  }

  res.json({
    success: true,
    did: studentData.did,
    wallet: studentData.wallet, // Real XRPL testnet address
    matricId,
    token: `mock-jwt-${matricId}-${Date.now()}`,
    network: "XRPL Testnet",
    message: "✅ Logged in with real XRPL testnet wallet"
  });
});

// Logout endpoint to clear cache
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully"
  });
});

module.exports = router;