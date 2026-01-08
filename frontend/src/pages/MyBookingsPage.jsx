import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { nftAPI } from '../services/api';
import QRCode from '../components/QRCode';
import Navigation from '../components/Navigation';

const MyBookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (user?.wallet) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user?.wallet) {
      setError('No wallet found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const response = await nftAPI.getUserBookings(user.wallet);
      
      if (response.data.success) {
        setBookings(response.data.bookings || []);
      } else {
        setError(response.data.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Fetch bookings error:', error);
      setError('Failed to fetch bookings. Please try again.');
      // Set empty bookings instead of crashing
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowQR = (booking) => {
    setSelectedNFT(booking); // Pass the full booking object
    setShowQR(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'USED': return 'bg-gray-100 text-gray-600';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-SG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg p-4 h-24 bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
        
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">📅</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No bookings found</h2>
            <p className="text-gray-500 mb-4">You haven't booked any study spaces yet.</p>
            <button 
              onClick={() => window.location.href = '/rooms'}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Rooms
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <div key={booking.nftId || index} className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{booking.roomName}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Booking Date</p>
                    <p className="font-medium">{formatDate(booking.bookingDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium">{booking.duration} hour{booking.duration > 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cost</p>
                    <p className="font-medium">{booking.cost} ST</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">NFT ID</p>
                    <p className="font-mono text-sm text-gray-500 truncate">{booking.nftId}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  {booking.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleShowQR(booking)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      📱 Show QR Code
                    </button>
                  )}
                  <button
                    onClick={fetchBookings}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showQR && selectedNFT && (
          <QRCode 
            nft={selectedNFT}
            onClose={() => {
              setShowQR(false);
              setSelectedNFT(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;