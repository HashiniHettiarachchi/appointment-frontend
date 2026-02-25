import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext'; 
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { config, getLabel } = useConfig();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
                {/* <Link to="/appointments" className="navbar-link">My Appointments</Link> */}
                <Link to="/appointments" className="navbar-link">
                  My {getLabel('booking', 2)}  {/* ← Dynamic: "Appointments" */}
                </Link>
              </li>
              
              {user?.role === 'admin' && (
                <>
                  <li className="navbar-item">
                    <Link to="/admin" className="navbar-link">Admin Dashboard</Link>
                  </li>
                  <li className="navbar-item">
                    {/* <Link to="/staff-approve" className="navbar-link">Staff Approval</Link> */}
                    <Link to="/staff-approve" className="navbar-link">
                    {getLabel('provider')} Approval  {/* ← Dynamic: "Staff Approval" */}
                    </Link>
                  </li>
                  <li className="navbar-item">
                    <Link to="/reports" className="navbar-link">Reports</Link>
                  </li>
                  <li className="navbar-item">
                    <Link to="/config" className="navbar-link">⚙️ Settings</Link>  {/* ← ADD THIS */}
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
