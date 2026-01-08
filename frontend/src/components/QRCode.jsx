import { useEffect, useState, useMemo } from 'react';
import QRCodeLib from 'qrcode';

const QRCode = ({ nft, onClose }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Calculate expiry time from NFT data (no setState in effect needed)
  const expiryTime = useMemo(() => {
    return nft.expiresAt ? new Date(nft.expiresAt) : null;
  }, [nft.expiresAt]);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Create QR data with NFT information
        const qrData = JSON.stringify({ 
          nftId: nft.nftId || nft.id,
          type: 'studypass-nft',
          room: nft.roomName || nft.room,
          expiresAt: nft.expiresAt
        });
        
        // Generate QR code as data URL
        const qrDataUrl = await QRCodeLib.toDataURL(qrData, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        setQrCodeUrl(qrDataUrl);
      } catch (error) {
        console.error('QR code generation failed:', error);
      }
    };

    generateQRCode();
  }, [nft]);

  useEffect(() => {
    if (!expiryTime) return;

    const updateTimer = () => {
      const now = new Date();
      const remaining = Math.max(0, expiryTime - now);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
      }
    };

    const timer = setInterval(updateTimer, 1000);
    updateTimer();

    return () => clearInterval(timer);
  }, [expiryTime]);

  const formatTime = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const getValidityStatus = () => {
    // Check NFT status first
    if (nft.status === 'USED') return 'Already Used';
    if (nft.status === 'EXPIRED') return 'Expired';
    
    // Then check time remaining
    if (timeRemaining > 0) {
      return formatTime(timeRemaining);
    } else {
      return 'Expired';
    }
  };

  const copyToClipboard = () => {
    const qrData = JSON.stringify({ 
      nftId: nft.nftId || nft.id,
      type: 'studypass-nft',
      room: nft.roomName || nft.room,
      expiresAt: nft.expiresAt
    });
    navigator.clipboard.writeText(qrData);
    alert('QR code data copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Seat Pass</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">NFT ID:</p>
            <p className="font-mono text-xs bg-white p-2 rounded border break-all">
              {nft.nftId || nft.id}
            </p>
            <p className="text-sm text-gray-600 mt-2 mb-1">Room:</p>
            <p className="font-semibold text-sm">
              {nft.roomName || nft.room}
            </p>
          </div>

          <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="mx-auto"
                style={{ width: '200px', height: '200px' }}
              />
            ) : (
              <div className="w-50 h-50 bg-gray-200 animate-pulse mx-auto"></div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
            <p className="text-sm font-medium text-blue-800">
              ⏱️ Valid for: {getValidityStatus()}
            </p>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>📱 Show this QR code at the room entrance</p>
            <p>🔒 This pass will expire after your booking duration</p>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              onClick={copyToClipboard}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              📋 Copy Data
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCode;