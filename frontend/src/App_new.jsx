import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import LoginPage from './pages/LoginPage';
import TokensPage from './pages/TokensPage';
import RoomsPage from './pages/RoomsPage';
import MyBookingsPage from './pages/MyBookingsPage';
import QRScannerPage from './pages/QRScannerPage';
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
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Navigation component
const Navigation = () => {
  const { isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) return null;
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900">StudyPass</h1>
            <div className="hidden md:flex space-x-6">
              <a href="/tokens" className="text-gray-600 hover:text-blue-600 font-medium">
                💰 Tokens
              </a>
              <a href="/rooms" className="text-gray-600 hover:text-blue-600 font-medium">
                🏢 Rooms
              </a>
              <a href="/bookings" className="text-gray-600 hover:text-blue-600 font-medium">
                📋 My Bookings
              </a>
              <a href="/scanner" className="text-gray-600 hover:text-blue-600 font-medium">
                📱 Scanner
              </a>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
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
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;