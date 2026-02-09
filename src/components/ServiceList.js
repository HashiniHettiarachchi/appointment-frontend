import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { servicesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ServiceList.css';

const ServiceList = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await servicesAPI.getAll();
      setServices(response.data);
    } catch (err) {
      setError('Failed to load services');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      haircut: '✂️',
      coloring: '🎨',
      styling: '💇',
      facial: '💆',
      manicure: '💅',
      pedicure: '🦶',
      massage: '🙌',
      other: '✨',
    };
    return icons[category] || '✨';
  };

  if (loading) {
    return (
      <div className="services-container">
        <div className="loading-spinner">Loading services...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="services-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="services-container">
      <div className="services-header">
        <h1>Our Services</h1>
        <p>Choose from our wide range of premium beauty services</p>
      </div>

      {services.length === 0 ? (
        <div className="no-services">
          <p>No services available at the moment.</p>
          <p>Please check back later!</p>
        </div>
      ) : (
        <div className="services-grid">
          {services.map((service) => (
            <div key={service._id} className="service-card">
              <div className="service-icon">
                {getCategoryIcon(service.category)}
              </div>
              
              <h3 className="service-name">{service.name}</h3>
              
              <p className="service-description">{service.description}</p>
              
              <div className="service-details">
                <div className="service-info">
                  <span className="info-label">Duration:</span>
                  <span className="info-value">{service.duration} mins</span>
                </div>
                
                <div className="service-info">
                  <span className="info-label">Price:</span>
                  <span className="info-value price">Rs.{service.price}</span>
                </div>
              </div>

              {isAuthenticated ? (
                <Link 
                  to="/book-appointment" 
                  state={{ service }} 
                  className="book-button"
                >
                  Book Now
                </Link>
              ) : (
                <Link to="/login" className="book-button">
                  Login to Book
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {!isAuthenticated && (
        <div className="login-prompt">
          <p>
            Want to book an appointment? 
            <Link to="/register"> Create an account</Link> or 
            <Link to="/login"> login</Link> to get started!
          </p>
        </div>
      )}
    </div>
  );
};

export default ServiceList;
