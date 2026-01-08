import { useState } from 'react';
import QRCode from '../components/QRCode';

const TestQRPage = () => {
  const [showQR, setShowQR] = useState(false);
  
  // Create mock NFT data - static since it's just for testing
  const createMockNFT = () => {
    const now = Date.now();
    return {
      nftId: 'SEAT-1736346123456-abc123def',
      studentWallet: 'rTestStudent123ABC',
      room: 'LT1',
      roomName: 'Central Library Level 1',
      duration: 120, // 2 hours in minutes
      tokensSpent: 4,
      bookedAt: now,
      expiresAt: now + (2 * 60 * 60 * 1000), // 2 hours from now
      status: 'ACTIVE'
    };
  };

  const [mockNFT] = useState(createMockNFT);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">QR Code Test</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Test QR Generation</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Mock NFT Data:</h3>
              <div className="text-sm space-y-1">
                <p><strong>ID:</strong> {mockNFT.nftId}</p>
                <p><strong>Room:</strong> {mockNFT.roomName}</p>
                <p><strong>Duration:</strong> {mockNFT.duration} minutes</p>
                <p><strong>Status:</strong> {mockNFT.status}</p>
                <p><strong>Expires:</strong> {new Date(mockNFT.expiresAt).toLocaleTimeString()}</p>
              </div>
            </div>

            <button
              onClick={() => setShowQR(true)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate QR Code
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                📱 This will show you how QR codes look and work
              </p>
            </div>
          </div>
        </div>

        {showQR && (
          <QRCode 
            nft={mockNFT} 
            onClose={() => setShowQR(false)} 
          />
        )}
      </div>
    </div>
  );
};

export default TestQRPage;