import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [matricId, setMatricId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(matricId);
    
    if (result.success) {
      navigate('/tokens');
    } else {
      setError(result.message);
    }
    
    setIsLoading(false);
  };

  const handleQuickLogin = (id) => {
    setMatricId(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">StudyPass</h1>
          <p className="text-gray-600">Login with your NUS Matric ID</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="matricId" className="block text-sm font-medium text-gray-700 mb-2">
              Matric ID
            </label>
            <input
              type="text"
              id="matricId"
              value={matricId}
              onChange={(e) => setMatricId(e.target.value.toUpperCase())}
              placeholder="A1234567Z"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              pattern="A\d{7}[A-Z]"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-8">
          <div className="text-sm text-gray-500 text-center mb-4">Quick Login (Demo)</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('A1234567Z')}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition-colors"
            >
              A1234567Z
            </button>
            <button
              onClick={() => handleQuickLogin('A2345678Y')}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition-colors"
            >
              A2345678Y
            </button>
            <button
              onClick={() => handleQuickLogin('A3456789X')}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition-colors"
            >
              A3456789X
            </button>
            <button
              onClick={() => handleQuickLogin('A4567890W')}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition-colors"
            >
              A4567890W
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;