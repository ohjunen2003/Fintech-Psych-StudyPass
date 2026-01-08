import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import LoginPage from './pages/LoginPage';
import TokensPage from './pages/TokensPage';
import RoomsPage from './pages/RoomsPage';
import MyBookingsPage from './pages/MyBookingsPage';
import QRScannerPage from './pages/QRScannerPage';
<<<<<<< HEAD
import TestQRPage from './pages/TestQRPage';
=======
import AnalyticsPage from './pages/AnalyticsPage';
>>>>>>> origin/feature/phase6
import Navigation from './components/Navigation';
import { testAPI } from './services/api';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// Test component for Phase 1 (can be removed later)
const TestComponent = () => {
  const [healthResult, setHealthResult] = React.useState(null);
  const [loginResult, setLoginResult] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const testHealth = async () => {
    setIsLoading(true);
    try {
      const response = await testAPI.health();
      setHealthResult(response.data);
    } catch (error) {
      setHealthResult({ error: error.message });
    }
    setIsLoading(false);
  };

  const testLogin = async () => {
    setIsLoading(true);
    try {
      const response = await testAPI.login('A1234567Z');
      setLoginResult(response.data);
    } catch (error) {
      setLoginResult({ error: error.message });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">StudyPass - Phase 1 Test</h1>
        
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-6">Test backend API connectivity</p>
            
            <div className="space-x-4">
              <button
                onClick={testHealth}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Test Health API
              </button>
              
              <button
                onClick={testLogin}
                disabled={isLoading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Test Login API
              </button>
            </div>
          </div>
          
          {healthResult && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Health API Result:</h3>
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(healthResult, null, 2)}
              </pre>
            </div>
          )}
          
          {loginResult && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Login API Result:</h3>
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(loginResult, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="text-center pt-4">
            <a 
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              → Go to Login Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Routes>
          {/* Test route for Phase 1 */}
          <Route path="/test" element={<TestComponent />} />
          
          {/* QR Test Page */}
          <Route path="/test-qr" element={<TestQRPage />} />
          
          {/* Login route */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes */}
          <Route 
            path="/tokens" 
            element={
              <ProtectedRoute>
                <TokensPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/rooms" 
            element={
              <ProtectedRoute>
                <RoomsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookings" 
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scanner" 
            element={
              <ProtectedRoute>
                <QRScannerPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
