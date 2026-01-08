import { useState } from 'react';
import { nftAPI, tokensAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const BookingForm = ({ room, onBookingSuccess, onClose }) => {
  const { user } = useAuth();
  const [duration, setDuration] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBooking = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Check if user has enough tokens
      const balanceResponse = await tokensAPI.getBalance(user.wallet);
      const currentBalance = balanceResponse.data.balance;
      const totalCost = room.price * duration;

      if (currentBalance < totalCost) {
        setError(`Insufficient tokens. Need ${totalCost}, have ${currentBalance}`);
        setIsLoading(false);
        return;
      }

      // Mint NFT (this will automatically burn the required tokens)
      const response = await nftAPI.mintNFT(user.wallet, room.id, duration);
      
      if (response.data.success) {
        onBookingSuccess(response.data.nft);
      } else {
        setError(response.data.message || 'Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setError(error.response?.data?.message || 'Failed to book room');
    } finally {
      setIsLoading(false);
    }
  };

  const totalCost = room.price * duration;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Book {room.name}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleBooking} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (hours)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1 hour</option>
              <option value={2}>2 hours</option>
              <option value={3}>3 hours</option>
              <option value={4}>4 hours</option>
            </select>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Price per hour:</span>
              <span className="font-medium">{room.price} ST</span>
            </div>
            <div className="flex justify-between items-center font-bold text-lg mt-2">
              <span>Total Cost:</span>
              <span className="text-blue-600">{totalCost} ST</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Booking...' : `Book for ${totalCost} ST`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;