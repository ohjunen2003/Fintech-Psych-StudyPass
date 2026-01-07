const xrpl = require("xrpl");

// Mock NFT storage (in production, use database)
const mintedNFTs = {};
const bookingHistory = {};

async function mintSeatNFT(studentWallet, seatData) {
  try {
    const nftId = `SEAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiryTime = seatData.bookedAt + (seatData.durationMinutes * 60 * 1000);
    
    // Create NFT metadata
    const nftMetadata = {
      nftId,
      studentWallet,
      room: seatData.roomId,
      roomName: seatData.roomName,
      duration: seatData.durationMinutes,
      tokensSpent: seatData.tokensUsed,
      bookedAt: seatData.bookedAt,
      expiresAt: expiryTime,
      status: "ACTIVE", // ACTIVE → USED → EXPIRED
      qrCode: `https://studypass.xrpl/verify/${nftId}`,
      scanHistory: []
    };

    // Store NFT
    mintedNFTs[nftId] = nftMetadata;
    
    // Track booking history
    if (!bookingHistory[studentWallet]) {
      bookingHistory[studentWallet] = [];
    }
    bookingHistory[studentWallet].push(nftId);

    console.log(`✅ NFT Minted: ${nftId} for ${studentWallet}`);
    
    return {
      success: true,
      nftId,
      metadata: nftMetadata,
      message: "Seat NFT minted successfully"
    };
    
  } catch (error) {
    console.error("❌ NFT Minting Error:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

function getNFT(nftId) {
  return mintedNFTs[nftId] || null;
}

function verifyNFT(nftId) {
  const nft = mintedNFTs[nftId];
  if (!nft) return { valid: false, reason: "NFT not found" };
  if (nft.status === "USED") return { valid: false, reason: "Already scanned" };
  if (nft.status === "EXPIRED") return { valid: false, reason: "Expired" };
  if (Date.now() > nft.expiresAt) {
    nft.status = "EXPIRED";
    return { valid: false, reason: "Time expired" };
  }
  
  return { valid: true, nft };
}

function markNFTAsUsed(nftId) {
  const nft = mintedNFTs[nftId];
  if (nft && nft.status === "ACTIVE") {
    nft.status = "USED";
    nft.scanHistory.push({
      scannedAt: Date.now(),
      location: "Door Entry System"
    });
    return true;
  }
  return false;
}

function getStudentBookings(wallet) {
  return bookingHistory[wallet] || [];
}

module.exports = {
  mintSeatNFT,
  getNFT,
  verifyNFT,
  markNFTAsUsed,
  getStudentBookings,
  mintedNFTs // For debugging
};