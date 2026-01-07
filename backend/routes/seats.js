const express = require("express");
const { roomsDB, getOccupancyPercent, calculateDynamicPrice } = require("../models/Seat");
const router = express.Router();

router.get("/browse", (req, res) => {
  const rooms = Object.values(roomsDB).map(room => {
    const occupancy = getOccupancyPercent(room.id);
    const dynamicPrice = calculateDynamicPrice(occupancy);
    
    return {
      ...room,
      availableSeats: room.totalSeats - room.occupiedSeats,
      occupancyPercent: occupancy,
      currentPrice: dynamicPrice,
      priceChange: dynamicPrice > room.basePrice ? "📈" : "📉",
      status: occupancy > 90 ? "Almost Full" : occupancy > 70 ? "Busy" : "Available"
    };
  });

  res.json({ 
    success: true,
    rooms: rooms.sort((a, b) => a.currentPrice - b.currentPrice) // Sort by price
  });
});

router.get("/room/:roomId", (req, res) => {
  const room = roomsDB[req.params.roomId];
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  const occupancy = getOccupancyPercent(req.params.roomId);
  const dynamicPrice = calculateDynamicPrice(occupancy);

  res.json({
    success: true,
    room: {
      ...room,
      availableSeats: room.totalSeats - room.occupiedSeats,
      occupancyPercent: occupancy,
      currentPrice: dynamicPrice,
      priceHistory: [
        { time: "8:00 AM", price: 0.8, occupancy: 20 },
        { time: "12:00 PM", price: 2.0, occupancy: 85 },
        { time: "6:00 PM", price: 1.2, occupancy: 60 },
        { time: "Now", price: dynamicPrice, occupancy }
      ]
    }
  });
});

module.exports = router;