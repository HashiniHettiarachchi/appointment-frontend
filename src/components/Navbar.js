import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext'; 
import Pusher from 'pusher-js';
import './Navbar.css';

const Navbar = () => {
  const [notifications, setNotifications] = useState([]);
  const { user, logout, isAuthenticated } = useAuth();
  const { config, getLabel } = useConfig();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Staff real-time notifications via Pusher
  useEffect(() => {
    if (user?.role === 'staff') {
      const pusher = new Pusher('YOUR_PUSHER_KEY', {
        cluster: 'YOUR_CLUSTER',
      });

      const channel = pusher.subscribe(`staff-${user._id}`);
      channel.bind('new-appointment', (data) => {
        setNotifications((prev) => [data, ...prev]);
      });

      return () => {
        pusher.unsubscribe(`staff-${user._id}`);
      };
    }
  }, [user]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          {config?.businessName || 'Booking System'}
        </Link>

        <ul className="navbar-menu">
          <li className="navbar-item">
            <Link to="/" className="navbar-link">Home</Link>
          </li>
          <li className="navbar-item">
            <Link to="/services" className="navbar-link">Services</Link>
          </li>

          {isAuthenticated ? (
            <>
              <li className="navbar-item">
                <Link to="/appointments" className="navbar-link">
                  My {getLabel('booking', 2)}
                </Link>
              </li>

              {user?.role === 'admin' && (
                <>
                  <li className="navbar-item">
                    <Link to="/admin" className="navbar-link">Admin Dashboard</Link>
                  </li>
                  <li className="navbar-item">
                    <Link to="/staff-approve" className="navbar-link">Staff Approval</Link>
                  </li>
                  <li className="navbar-item">
                    <Link to="/reports" className="navbar-link">Reports</Link>
                  </li>
                  <li className="navbar-item">
                    <Link to="/config" className="navbar-link">⚙️ Settings</Link>
                  </li>
                </>
              )}

              {user?.role === 'staff' && (
                <>
                  <li className="navbar-item navbar-notification">
                    🔔
                    {notifications.length > 0 && (
                      <span className="notification-count">{notifications.length}</span>
                    )}
                    
                  </li>
                </>
              )}

              <li className="navbar-item">
                <span className="navbar-user">👤 {user?.name}</span>
              </li>
              
              <li className="navbar-item">
                <button onClick={handleLogout} className="navbar-button">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="navbar-item">
                <Link to="/login" className="navbar-link">Login</Link>
              </li>
              <li className="navbar-item">
                <Link to="/register" className="navbar-button">Register</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;