const express = require("express");
const { mintedNFTs } = require("../utils/nftMinter");
const { tokenBalances } = require("./tokens");
const { roomsDB } = require("../models/Seat");
const router = express.Router();

router.get("/dashboard", (req, res) => {
  const { start, end } = req.query;
  let nfts = Object.values(mintedNFTs);
  // If date filters provided, filter by bookedAt timestamp (ms)
  if (start || end) {
    const startTs = start ? Date.parse(start) : 0;
    const endTs = end ? Date.parse(end) + 24*60*60*1000 - 1 : Infinity; // inclusive end of day
    nfts = nfts.filter(n => {
      const t = typeof n.bookedAt === 'number' ? n.bookedAt : Date.parse(n.bookedAt || 0);
      return t >= startTs && t <= endTs;
    });
  }
  const totalTokens = Object.values(tokenBalances).reduce((sum, bal) => sum + bal, 0);
  
  // Calculate stats
  const stats = {
    totalBookings: nfts.length,
    activeBookings: nfts.filter(n => n.status === "ACTIVE").length,
    completedBookings: nfts.filter(n => n.status === "USED").length,
    expiredBookings: nfts.filter(n => n.status === "EXPIRED").length,
    totalTokensInCirculation: totalTokens,
    totalRevenue: nfts.reduce((sum, n) => sum + n.tokensSpent, 0),
    averageBookingDuration: Math.round(
      nfts.reduce((sum, n) => sum + n.duration, 0) / nfts.length || 0
    ),
    mostPopularRoom: getMostPopularRoom(nfts),
    peakHours: getPeakBookingHours(nfts)
  };

  res.json({
    success: true,
    stats,
    rooms: Object.values(roomsDB).map(room => {
      const bookingsForRoom = nfts.filter(n => n.room === room.id || n.room === room.roomId || n.room === room.name);
      const revenue = bookingsForRoom.reduce((s, b) => s + (b.tokensSpent || 0), 0);
      return {
        ...room,
        occupancyPercent: Math.round((room.occupiedSeats / room.totalSeats) * 100),
        bookings: bookingsForRoom.length,
        revenue
      };
    })
  });
});

function getMostPopularRoom(nfts) {
  const roomCounts = {};
  nfts.forEach(nft => {
    roomCounts[nft.room] = (roomCounts[nft.room] || 0) + 1;
  });
  
  const mostPopular = Object.entries(roomCounts)
    .sort(([,a], [,b]) => b - a)[0];
  
  return mostPopular ? { roomId: mostPopular[0], bookings: mostPopular[1] } : null;
}

function getPeakBookingHours(nfts) {
  const hourCounts = {};
  nfts.forEach(nft => {
    const hour = new Date(nft.bookedAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  return Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: `${hour}:00`, bookings: count }));
}

module.exports = router;