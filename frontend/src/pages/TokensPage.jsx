import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { tokensAPI } from '../services/api';

const TokensPage = () => {
  const [balance, setBalance] = useState(0);
  const [mintAmount, setMintAmount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadBalance();
    }
  }, [user]);

  const loadBalance = async () => {
    try {
      const response = await tokensAPI.getBalance(user.wallet);
      if (response.data.success) {
        setBalance(response.data.balance);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const handleMintTokens = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await tokensAPI.mintTokens(user.wallet, mintAmount);
      
      if (response.data.success) {
        setSuccess(`Successfully minted ${mintAmount} StudyTokens!`);
        await loadBalance(); // Refresh balance
      } else {
        setError(response.data.message || 'Failed to mint tokens');
      }
    } catch (error) {
      setError('Network error occurred');
    }
    
    setIsLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">StudyPass Wallet</h1>
              <p className="text-gray-600">Manage your StudyTokens</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Matric ID:</span>
              <span className="font-mono">{user?.matricId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">DID:</span>
              <span className="font-mono text-xs">{user?.did}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Wallet:</span>
              <span className="font-mono text-xs">{user?.wallet}</span>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
          <div className="text-center">
            <h2 className="text-lg font-medium opacity-90">StudyToken Balance</h2>
            <div className="text-4xl font-bold mt-2 mb-1">{balance}</div>
            <p className="text-sm opacity-75">Available for booking study spaces</p>
          </div>
        </div>

        {/* Mint Tokens */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Mint StudyTokens</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to mint
              </label>
              <input
                type="number"
                value={mintAmount}
                onChange={(e) => setMintAmount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                {success}
              </div>
            )}

            <button
              onClick={handleMintTokens}
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Minting...' : `Mint ${mintAmount} StudyTokens`}
            </button>

            <div className="text-xs text-gray-500 text-center">
              💡 In the demo, tokens are free. In production, they would cost real money.
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/rooms')}
              className="bg-blue-100 text-blue-700 p-4 rounded-lg hover:bg-blue-200 transition-colors text-center"
            >
              <div className="text-2xl mb-2">🏢</div>
              <div className="font-medium">Browse Rooms</div>
            </button>
            <button
              onClick={() => navigate('/bookings')}
              className="bg-purple-100 text-purple-700 p-4 rounded-lg hover:bg-purple-200 transition-colors text-center"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="font-medium">My Bookings</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokensPage;