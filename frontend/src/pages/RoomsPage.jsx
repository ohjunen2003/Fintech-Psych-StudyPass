import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { seatsAPI } from '../services/api';
import RoomCard from '../components/RoomCard';
import BookingForm from '../components/BookingForm';
import QRCode from '../components/QRCode';

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('price'); // 'price', 'occupancy', 'name'
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [bookedNFT, setBookedNFT] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setIsLoading(true);
      const response = await seatsAPI.browseRooms();
      
      if (response.data.success) {
        setRooms(response.data.rooms);
      } else {
        setError('Failed to load rooms');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Error loading rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSortedRooms = () => {
    const sorted = [...rooms];
    
    switch (sortBy) {
      case 'price':
        return sorted.sort((a, b) => a.price - b.price);
      case 'occupancy':
        return sorted.sort((a, b) => {
          const aOccupancy = (a.occupancy / a.capacity) * 100;
          const bOccupancy = (b.occupancy / b.capacity) * 100;
          return aOccupancy - bOccupancy;
        });
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
    }
  };

  const handleBookNow = (room) => {
    setSelectedRoom(room);
    setShowBookingForm(true);
  };

  const handleBookingSuccess = (nft) => {
    setBookedNFT(nft);
    setShowBookingForm(false);
    setShowQRCode(true);
    // Refresh rooms to update occupancy
    loadRooms();
  };

  const handleCloseBookingForm = () => {
    setShowBookingForm(false);
    setSelectedRoom(null);
  };

  const handleCloseQRCode = () => {
    setShowQRCode(false);
    setBookedNFT(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading study rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Study Rooms</h1>
              <p className="text-gray-600">Find and book your perfect study space</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/tokens')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                💰 Wallet
              </button>
              <button
                onClick={() => navigate('/bookings')}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                📋 My Bookings
              </button>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* User Balance */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl shadow-lg p-4 mb-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="opacity-90">Welcome, {user?.matricId}</p>
              <p className="text-sm opacity-75">Ready to book your study space?</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">StudyTokens</p>
              <p className="text-2xl font-bold">Loading...</p>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Available Rooms ({rooms.length})
              </h2>
              <p className="text-sm text-gray-600">
                Prices shown are per hour and updated dynamically
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="price">Price (Low to High)</option>
                <option value="occupancy">Occupancy (Low to High)</option>
                <option value="name">Name (A to Z)</option>
              </select>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span>📈</span>
              <span>High demand - Premium pricing</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>📊</span>
              <span>Medium demand - Standard pricing</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>📉</span>
              <span>Low demand - Discounted pricing</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
            <button
              onClick={loadRooms}
              className="ml-4 text-red-700 hover:text-red-800 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getSortedRooms().map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onBookNow={handleBookNow}
            />
          ))}
        </div>

        {/* Empty State */}
        {rooms.length === 0 && !isLoading && !error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No rooms available</h3>
            <p className="text-gray-600 mb-4">All study spaces are currently booked.</p>
            <button
              onClick={loadRooms}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Rooms
            </button>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={loadRooms}
            disabled={isLoading}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Refreshing...' : '🔄 Refresh Rooms'}
          </button>
        </div>

        {/* Booking Form Modal */}
        {showBookingForm && selectedRoom && (
          <BookingForm
            room={selectedRoom}
            onBookingSuccess={handleBookingSuccess}
            onClose={handleCloseBookingForm}
          />
        )}

        {/* QR Code Modal */}
        {showQRCode && bookedNFT && (
          <QRCode
            nftId={bookedNFT.id}
            onClose={handleCloseQRCode}
          />
        )}
      </div>
    </div>
  );
};

export default RoomsPage;