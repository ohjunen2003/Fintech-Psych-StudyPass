import { useState } from 'react';
import { nftAPI } from '../services/api';
import jsQR from 'jsqr';

const QRScannerPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');

  // Function to decode QR code from image file
  const decodeQRFromFile = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        resolve(code ? code.data : null);
      };
      
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
      setError('');
      setScanResult(null);
    }
  };

  const processQRCode = async () => {
    console.log('🔍 Starting QR code processing...');
    
    if (!selectedFile) {
      console.log('❌ No file selected');
      setScanResult({
        success: false,
        message: 'Please select an image file first',
        timestamp: new Date().toISOString()
      });
      return;
    }

    setIsScanning(true);
    setError('');

    try {
      console.log('📸 Decoding QR from file...');
      const qrData = await decodeQRFromFile(selectedFile);
      
      if (!qrData) {
        console.log('❌ No QR code found in image');
        setScanResult({
          success: false,
          message: 'No valid QR code found in the image',
          timestamp: new Date().toISOString()
        });
        setIsScanning(false);
        return;
      }

      console.log('📋 QR Data found:', qrData);

      // Parse QR data
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
        console.log('✅ Parsed QR data:', parsedData);
      } catch (error) {
        console.log('❌ Invalid JSON in QR code' + error);
        setScanResult({
          success: false,
          message: 'Invalid QR code format - not valid JSON',
          timestamp: new Date().toISOString()
        });
        setIsScanning(false);
        return;
      }

      if (parsedData.type !== 'studypass-nft' || !parsedData.nftId) {
        console.log('❌ Not a StudyPass NFT QR code');
        setScanResult({
          success: false,
          message: 'This is not a valid StudyPass NFT QR code',
          timestamp: new Date().toISOString()
        });
        setIsScanning(false);
        return;
      }
      
      console.log('🔍 Verifying NFT:', parsedData.nftId);
      const verifyResponse = await nftAPI.verifyNFT(parsedData.nftId);
      console.log('📋 Verify response:', verifyResponse.data);
      
      if (verifyResponse.data.success) {
        console.log('✅ NFT is valid, proceeding to scan...');
        const scanResponse = await nftAPI.scanNFT(parsedData.nftId);
        console.log('📋 Scan response:', scanResponse.data);
        
        if (scanResponse.data.success) {
          setScanResult({
            success: true,
            nftId: parsedData.nftId,
            roomName: scanResponse.data.details?.room || parsedData.room || 'Study Room',
            message: scanResponse.data.message || 'Access Granted! Welcome to your study space.',
            details: scanResponse.data.details,
            timestamp: new Date().toISOString()
          });
        } else {
          setScanResult({
            success: false,
            nftId: parsedData.nftId,
            message: scanResponse.data.error || scanResponse.data.message || 'Access Denied',
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.log('❌ NFT verification failed:', verifyResponse.data.error);
        setScanResult({
          success: false,
          nftId: parsedData.nftId,
          message: verifyResponse.data.error || verifyResponse.data.message || 'Invalid QR Code',
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('💥 QR scanning error:', error);
      setScanResult({
        success: false,
        message: error.response?.data?.error || error.response?.data?.message || `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsScanning(false);
    }
  };

  const resetScanner = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setError('');
    // Reset file input
    const fileInput = document.getElementById('qr-file-input');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">QR Scanner</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          {!scanResult ? (
            <div className="space-y-6">
              {/* File Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">📸</div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Upload QR Code Image
                </h3>
                <p className="text-gray-500 mb-4">
                  Select an image containing a StudyPass QR code
                </p>
                
                <input
                  id="qr-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="qr-file-input"
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors cursor-pointer inline-block"
                >
                  Choose Image
                </label>
              </div>

              {/* Image Preview */}
              {previewUrl && (
                <div className="text-center">
                  <h4 className="font-medium text-gray-700 mb-3">Selected Image:</h4>
                  <img
                    src={previewUrl}
                    alt="QR Code Preview"
                    className="max-w-full max-h-64 mx-auto rounded-lg border"
                  />
                  
                  <div className="mt-4 space-x-3">
                    <button
                      onClick={processQRCode}
                      disabled={isScanning}
                      className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isScanning ? (
                        <>
                          <span className="inline-block animate-spin mr-2">⚡</span>
                          Scanning...
                        </>
                      ) : (
                        '🔍 Scan QR Code'
                      )}
                    </button>
                    <button
                      onClick={resetScanner}
                      className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Choose Different Image
                    </button>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">❌</span>
                    {error}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="font-medium text-blue-800 mb-2">📋 How to use:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>1. Take a photo of a StudyPass QR code or choose from gallery</li>
                  <li>2. Upload the image using the button above</li>
                  <li>3. Click "Scan QR Code" to verify access</li>
                  <li>4. The system will grant or deny access based on the NFT status</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Scan Results */
            <div className="text-center space-y-4">
              <div className={`text-6xl mb-4 ${scanResult.success ? 'text-green-500' : 'text-red-500'}`}>
                {scanResult.success ? '✅' : '❌'}
              </div>
              
              <div className={`p-4 rounded-lg ${
                scanResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <h3 className={`text-xl font-bold mb-2 ${
                  scanResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {scanResult.success ? 'Access Granted!' : 'Access Denied'}
                </h3>
                
                <p className={`text-lg mb-3 ${
                  scanResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {scanResult.message}
                </p>
                
                {scanResult.roomName && scanResult.success && (
                  <p className="text-green-600 font-medium">
                    Welcome to {scanResult.roomName}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">NFT ID:</p>
                <p className="font-mono text-sm break-all">{scanResult.nftId}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Scanned at: {new Date(scanResult.timestamp).toLocaleString()}
                </p>
              </div>

              <button
                onClick={resetScanner}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Scan Another QR Code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScannerPage;