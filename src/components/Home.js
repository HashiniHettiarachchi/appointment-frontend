import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">💈 Welcome to Premium Salon</h1>
        <p className="hero-subtitle">
          Your beauty, our priority. Book your appointment in seconds!
        </p>

        {isAuthenticated ? (
          <div className="hero-buttons">
            <Link to="/services" className="hero-button primary">
              Browse Services
            </Link>
            <Link to="/appointments" className="hero-button secondary">
              My Appointments
            </Link>
          </div>
        ) : (
          <div className="hero-buttons">
            <Link to="/register" className="hero-button primary">
              Get Started
            </Link>
            <Link to="/login" className="hero-button secondary">
              Login
            </Link>
          </div>
        )}
      </div>

      <div className="features-section">
        <h2 className="section-title">Why Choose Us?</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Easy Booking</h3>
            <p>Book appointments online 24/7. No more phone calls!</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">✂️</div>
            <h3>Expert Stylists</h3>
            <p>Choose from our team of professional stylists and beauticians.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Great Prices</h3>
            <p>Competitive pricing with no hidden fees.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⭐</div>
            <h3>Quality Service</h3>
            <p>Premium products and exceptional customer service.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🕒</div>
            <h3>Flexible Hours</h3>
            <p>We're open early mornings to late evenings for your convenience.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>SMS Reminders</h3>
            <p>Never miss an appointment with our reminder notifications.</p>
          </div>
        </div>
      </div>

      <div className="services-preview">
        <h2 className="section-title">Popular Services</h2>
        
        <div className="services-grid">
          <div className="service-preview-card">
            <h3>✂️ Haircut & Styling</h3>
            <p>Professional cuts and styling for all hair types</p>
            <span className="price">Starting at Rs.50</span>
          </div>

          <div className="service-preview-card">
            <h3>🎨 Hair Coloring</h3>
            <p>Expert coloring, highlights, and balayage</p>
            <span className="price">Starting at Rs.80</span>
          </div>

          <div className="service-preview-card">
            <h3>💆 Facial Treatment</h3>
            <p>Rejuvenating facials for glowing skin</p>
            <span className="price">Starting at Rs.60</span>
          </div>

          <div className="service-preview-card">
            <h3>💅 Manicure & Pedicure</h3>
            <p>Pamper your hands and feet</p>
            <span className="price">Starting at Rs.40</span>
          </div>
        </div>

        <div className="cta-container">
          <Link to="/services" className="cta-button">
            View All Services →
          </Link>
        </div>
      </div>

      {isAuthenticated && user && (
        <div className="welcome-banner">
          <p>👋 Welcome back, <strong>{user.name}</strong>!</p>
          <Link to="/services" className="banner-link">
            Ready to book your next appointment?
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
