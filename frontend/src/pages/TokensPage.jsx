import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { tokensAPI, ammAPI } from '../services/api';

const TokensPage = () => {
  const [studyTokenBalance, setStudyTokenBalance] = useState(null);
  const [rlusdBalance, setRLUSDBalance] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [rlusdAmount, setRLUSDAmount] = useState(10);
  const [ammPrice, setAmmPrice] = useState(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [conversionRate, setConversionRate] = useState(2);
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

  useEffect(() => {
    // Fetch AMM price whenever amount changes
    if (rlusdAmount > 0) {
      fetchAMMPrice();
    }
  }, [rlusdAmount]);

  const fetchAMMPrice = async () => {
    try {
      setIsLoadingPrice(true);
      const response = await ammAPI.getPrice(rlusdAmount, 'USD');
      if (response.data.success) {
        setAmmPrice(response.data);
      }
    } catch (error) {
      console.error('Error fetching AMM price:', error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  const loadBalance = async () => {
    try {
      setIsLoadingBalance(true);
      const response = await tokensAPI.getBalance(user.wallet);
      if (response.data.success) {
        setStudyTokenBalance(response.data.studyTokenBalance || response.data.balance || 0);
        setRLUSDBalance(response.data.rlusdBalance || 0);
        setConversionRate(response.data.conversionRate || 2);
      } else {
        setStudyTokenBalance(0);
        setRLUSDBalance(0);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
      setStudyTokenBalance(0);
      setRLUSDBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleConvertRLUSD = async () => {
    if (!user) return;
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Call AMM swap endpoint instead of old conversion
      const response = await fetch('http://localhost:3001/api/amm/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'USD',
          amount: rlusdAmount,
          userWallet: user.wallet
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`✅ Swapped ${rlusdAmount} USD through AMM! TX: ${data.txHash.slice(0, 8)}...`);
        await loadBalance();
        await fetchAMMPrice(); // Refresh to see pool change
      } else {
        setError(data.error || 'Swap failed');
      }
    } catch (error) {
      setError(error.message || 'Network error occurred');
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

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* RLUSD Balance */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="text-center">
              <h2 className="text-lg font-medium opacity-90">RLUSD Balance</h2>
              <div className="text-3xl font-bold mt-2 mb-1">
                {isLoadingBalance ? "Loading..." : (rlusdBalance !== null ? rlusdBalance : 0)}
              </div>
              <p className="text-sm opacity-75">Stable digital currency (1:1 USD)</p>
            </div>
          </div>

          {/* StudyToken Balance */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="text-center">
              <h2 className="text-lg font-medium opacity-90">StudyToken Balance</h2>
              <div className="text-3xl font-bold mt-2 mb-1">
                {isLoadingBalance ? "Loading..." : (studyTokenBalance !== null ? studyTokenBalance : 0)}
              </div>
              <p className="text-sm opacity-75">Available for booking study spaces</p>
            </div>
          </div>
        </div>

        {/* Convert RLUSD to StudyTokens */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">💱 Swap with AMM Pricing</h2>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <p className="text-purple-900 font-semibold">Real XRPL AMM Integration</p>
            <p className="text-purple-700 text-sm">Dynamic pricing via constant-product formula (USD ↔ STK)</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                USD Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={rlusdAmount}
                  onChange={(e) => setRLUSDAmount(Math.max(0.1, parseFloat(e.target.value) || 0))}
                  min="0.1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-16"
                />
                <span className="absolute right-3 top-2 text-gray-500 text-sm">USD</span>
              </div>
            </div>

            {/* AMM Pricing Display */}
            {isLoadingPrice ? (
              <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
                ⏳ Fetching live price...
              </div>
            ) : ammPrice ? (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Output Amount</p>
                    <p className="font-bold text-lg text-gray-900">{ammPrice.output.amount.toFixed(2)} {ammPrice.output.token}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Execution Price</p>
                    <p className="font-bold text-lg text-gray-900">{ammPrice.pricing.executionPrice}</p>
                  </div>
                </div>
                <div className="border-t pt-2">
                  <p className="text-xs text-gray-600">Price Impact</p>
                  <p className={`font-semibold ${ammPrice.pricing.priceImpact.includes('-') ? 'text-green-600' : 'text-orange-600'}`}>
                    {ammPrice.pricing.priceImpact}
                  </p>
                </div>
              </div>
            ) : null}

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                ❌ {error}
              </div>
            )}

            {success && (
              <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
                {success}
              </div>
            )}

            <button
              onClick={handleConvertRLUSD}
              disabled={isLoading || !rlusdBalance || rlusdAmount > rlusdBalance}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? 'Converting...' : `Swap ${rlusdAmount} USD → ${ammPrice ? ammPrice.output.amount.toFixed(2) : '?'} STK`}
            </button>

            <div className="text-xs text-gray-500 text-center">
              <p>📊 Real on-chain AMM with dynamic pricing</p>
              <p>🔗 Settlement on XRPL testnet</p>
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