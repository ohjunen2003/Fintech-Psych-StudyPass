const express = require("express");
const router = express.Router();

// Mock NUS matric → DID mapping
const studentDIDMap = {
  "A1234567Z": "did:xrpl:rNUSstudent001xTp9",
  "A7654321Z": "did:xrpl:rNUSstudent002yUq0",
  "A1111111A": "did:xrpl:rNUSstudent003zVr1"
};

router.post("/login", (req, res) => {
  const { matricId, signature, publicKey } = req.body;

  if (!matricId) {
    return res.status(400).json({ error: "Missing matricId" });
  }

  // Verify matric exists
  if (!studentDIDMap[matricId]) {
    return res.status(401).json({ error: "Invalid NUS matric ID" });
  }

  // Mock signature verification (real app uses wallet signature)
  const isSignatureValid = true;

  if (!isSignatureValid) {
    return res.status(401).json({ error: "Invalid wallet signature" });
  }

  res.json({
    success: true,
    did: studentDIDMap[matricId],
    wallet: publicKey || "rMockStudentWallet1234567890",
    matricId,
    token: `mock-jwt-${matricId}-${Date.now()}`
  });
});

module.exports = router;