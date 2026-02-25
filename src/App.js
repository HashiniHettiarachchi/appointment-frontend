import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import ServiceList from './components/ServiceList';
import BookAppointment from './components/BookAppointment';
import AppointmentList from './components/AppointmentList';
import AdminDashboard from './components/AdminDashboard';
import ApproveStaff from './components/ApproveStaff';
import Payment from './components/Payment';
import Reports from './components/Reports';
import { ConfigProvider } from './context/ConfigContext'; 
import ConfigSettings from './components/ConfigSettings';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="loading-page">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
};

// Main App Component
function AppContent() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/services" element={<ServiceList />} />

          {/* Protected Routes */}
          <Route
            path="/book-appointment"
            element={
              <ProtectedRoute>
                <BookAppointment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <AppointmentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />

          {/* Admin Only Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff-approve"
            element={
              <ProtectedRoute adminOnly={true}>
                <ApproveStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute adminOnly={true}>
                <Reports />
              </ProtectedRoute>
            }
          />

          <Route
          path="/config"
          element={
            <ProtectedRoute adminOnly={true}>
              <ConfigSettings />
            </ProtectedRoute>
          }
        />

          {/* 404 - Redirect to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}


function App() {
  return (
    <ConfigProvider>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
    </ConfigProvider>
  );
}



export default App;
