import React from 'react';

const RoomCard = ({ room, onBookNow }) => {
  // Use backend data structure
  const occupancyPercentage = room.occupancyPercent || 0;
  const totalSeats = room.totalSeats || 0;
  const occupiedSeats = room.occupiedSeats || 0;
  const availableSeats = room.availableSeats || (totalSeats - occupiedSeats);
  
  const isHighDemand = occupancyPercentage > 70;
  const isMediumDemand = occupancyPercentage > 40;

  const getPriceIndicator = () => {
    if (isHighDemand) return '📈'; // High demand - price increased
    if (isMediumDemand) return '📊'; // Medium demand - normal price
    return '📉'; // Low demand - reduced price
  };

  const getOccupancyColor = () => {
    if (isHighDemand) return 'text-red-600 bg-red-50';
    if (isMediumDemand) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Room Header */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{room.name}</h3>
            <p className="text-gray-600">{room.location}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1">
              <span className="text-2xl font-bold text-blue-600">{room.currentPrice || room.basePrice || 1}</span>
              <span className="text-sm">{room.priceChange || getPriceIndicator()}</span>
            </div>
            <p className="text-xs text-gray-500">StudyTokens/hour</p>
          </div>
        </div>

        {/* Room Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {room.facilities?.map((feature, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Occupancy Status */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Occupancy</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOccupancyColor()}`}>
              {occupancyPercentage}% full
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isHighDemand ? 'bg-red-500' : 
                isMediumDemand ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${occupancyPercentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{occupiedSeats}/{totalSeats} occupied</span>
            <span>{availableSeats} available</span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
          <div>
            <span className="font-medium">Capacity:</span> {totalSeats} seats
          </div>
          <div>
            <span className="font-medium">Type:</span> {room.status || 'Study Space'}
          </div>
        </div>

        {/* Book Button */}
        <button
          onClick={() => onBookNow(room)}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            availableSeats > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={availableSeats <= 0}
        >
          {availableSeats > 0 ? 'Book Now' : 'Fully Booked'}
        </button>
      </div>
    </div>
  );
};

export default RoomCard;