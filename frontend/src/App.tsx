import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import FarmerDashboard from './pages/FarmerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Guard for protected routes
const PrivateRoute: React.FC<{ children: React.ReactNode; allowedRole?: string }> = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)', background: 'var(--bg-primary)' }}>
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // If user has a different role, redirect to their designated dashboard
    if (user.role === 'FARMER') return <Navigate to="/farmer-dashboard" replace />;
    if (user.role === 'BUYER') return <Navigate to="/buyer-dashboard" replace />;
    if (user.role === 'DRIVER') return <Navigate to="/driver-dashboard" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Root route handler that redirects based on role
const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)', background: 'var(--bg-primary)' }}>
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'FARMER') return <Navigate to="/farmer-dashboard" replace />;
  if (user.role === 'BUYER') return <Navigate to="/buyer-dashboard" replace />;
  if (user.role === 'DRIVER') return <Navigate to="/driver-dashboard" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route 
            path="/farmer-dashboard" 
            element={
              <PrivateRoute allowedRole="FARMER">
                <FarmerDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/buyer-dashboard" 
            element={
              <PrivateRoute allowedRole="BUYER">
                <BuyerDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/driver-dashboard" 
            element={
              <PrivateRoute allowedRole="DRIVER">
                <DriverDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin-dashboard" 
            element={
              <PrivateRoute allowedRole="ADMIN">
                <AdminDashboard />
              </PrivateRoute>
            } 
          />

          {/* Default Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
