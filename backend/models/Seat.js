const roomsDB = {
  "central-l1": {
    id: "central-l1",
    name: "Central Library Level 1",
    totalSeats: 300,
    occupiedSeats: 255, // 85% occupancy
    basePrice: 1.0,
    location: "Central Library",
    facilities: ["WiFi", "Power outlets", "Air-con"],
    openHours: "24/7"
  },
  "central-l2": {
    id: "central-l2", 
    name: "Central Library Level 2",
    totalSeats: 200,
    occupiedSeats: 100, // 50% occupancy
    basePrice: 1.0,
    location: "Central Library",
    facilities: ["WiFi", "Power outlets", "Quiet zone"],
    openHours: "24/7"
  },
  "sde-study": {
    id: "sde-study",
    name: "SDE Study Room",
    totalSeats: 50,
    occupiedSeats: 48, // 96% occupancy
    basePrice: 1.0,
    location: "School of Design & Engineering",
    facilities: ["WiFi", "Whiteboards", "Group discussion"],
    openHours: "8:00 AM - 10:00 PM"
  },
  "utown-lounge": {
    id: "utown-lounge",
    name: "University Town Learning Lounge",
    totalSeats: 150,
    occupiedSeats: 45, // 30% occupancy
    basePrice: 1.0,
    location: "University Town",
    facilities: ["WiFi", "Café nearby", "Comfortable seating"],
    openHours: "24/7"
  }
};

function getOccupancyPercent(roomId) {
  const room = roomsDB[roomId];
  if (!room) return 0;
  return Math.round((room.occupiedSeats / room.totalSeats) * 100);
}

function calculateDynamicPrice(occupancyPercent) {
  if (occupancyPercent < 30) return 0.8;      // Low demand
  if (occupancyPercent < 70) return 1.2;      // Normal demand  
  if (occupancyPercent < 90) return 2.0;      // High demand
  return 3.5;                                  // Surge pricing
}

module.exports = { roomsDB, getOccupancyPercent, calculateDynamicPrice };