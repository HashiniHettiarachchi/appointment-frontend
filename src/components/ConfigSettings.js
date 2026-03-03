import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import axios from 'axios';
import './ConfigSettings.css';

// Preset configurations for each business type
const businessPresets = {
  salon: {
    terminology: {
      service: { singular: 'Service', plural: 'Services' },
      provider: { singular: 'Staff', plural: 'Staff Members' },
      booking: { singular: 'Appointment', plural: 'Appointments' },
      customer: { singular: 'Customer', plural: 'Customers' }
    },
    features: {
      requireStaffApproval: true,
      enableOnlinePayment: true,
      enableCashPayment: true
    }
  },
  hospital: {
    terminology: {
      service: { singular: 'Consultation', plural: 'Consultations' },
      provider: { singular: 'Doctor', plural: 'Doctors' },
      booking: { singular: 'Appointment', plural: 'Appointments' },
      customer: { singular: 'Patient', plural: 'Patients' }
    },
    features: {
      requireStaffApproval: true,
      enableOnlinePayment: true,
      enableCashPayment: true
    }
  },
  hotel: {
    terminology: {
      service: { singular: 'Room', plural: 'Rooms' },
      provider: { singular: 'Room', plural: 'Rooms' },
      booking: { singular: 'Reservation', plural: 'Reservations' },
      customer: { singular: 'Guest', plural: 'Guests' }
    },
    features: {
      requireStaffApproval: false,
      enableOnlinePayment: true,
      enableCashPayment: false
    }
  },
  restaurant: {
    terminology: {
      service: { singular: 'Table', plural: 'Tables' },
      provider: { singular: 'Table', plural: 'Tables' },
      booking: { singular: 'Reservation', plural: 'Reservations' },
      customer: { singular: 'Diner', plural: 'Diners' }
    },
    features: {
      requireStaffApproval: false,
      enableOnlinePayment: false,
      enableCashPayment: true
    }
  },
  gym: {
    terminology: {
      service: { singular: 'Class', plural: 'Classes' },
      provider: { singular: 'Trainer', plural: 'Trainers' },
      booking: { singular: 'Session', plural: 'Sessions' },
      customer: { singular: 'Member', plural: 'Members' }
    },
    features: {
      requireStaffApproval: true,
      enableOnlinePayment: true,
      enableCashPayment: true
    }
  }
};

const ConfigSettings = () => {
  const { config } = useConfig();
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'salon',
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    terminology: businessPresets.salon.terminology,
    features: businessPresets.salon.features
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (config) {
      setFormData({
        businessName: config.businessName || '',
        businessType: config.businessType || 'salon',
        primaryColor: config.primaryColor || '#667eea',
        secondaryColor: config.secondaryColor || '#764ba2',
        terminology: config.terminology || businessPresets.salon.terminology,
        features: config.features || businessPresets.salon.features
      });
    }
  }, [config]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If business type changes, auto-load preset
    if (name === 'businessType') {
      const preset = businessPresets[value];
      setFormData({
        ...formData,
        businessType: value,
        terminology: preset.terminology,
        features: preset.features
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'https://appointment-backend-wpie.vercel.app/api/config',
        formData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setSuccess('✅ Configuration updated! Refreshing in 2 seconds...');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setError('❌ Failed to update configuration: ' + (err.response?.data?.message || err.message));
    }
  };
  
  return (
    <div className="config-settings">
      <h1>⚙️ System Configuration</h1>
      
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Business Name</label>
          <input
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            placeholder="e.g., City Medical Center"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Business Type</label>
          <select
            name="businessType"
            value={formData.businessType}
            onChange={handleChange}
          >
            <option value="salon">💇 Salon / Beauty</option>
            <option value="hospital">🏥 Hospital / Clinic</option>
            <option value="hotel">🏨 Hotel / Resort</option>
            <option value="restaurant">🍽️ Restaurant</option>
            <option value="gym">💪 Gym / Fitness</option>
          </select>
          <small style={{color: '#666', fontSize: '14px'}}>
            ℹ️ Changing business type will update labels automatically
          </small>
        </div>
        
        <div className="terminology-preview">
          <h3>📝 Labels Preview</h3>
          <div className="preview-grid">
            <div className="preview-item">
              <strong>Services:</strong> {formData.terminology.service.plural}
            </div>
            <div className="preview-item">
              <strong>Staff:</strong> {formData.terminology.provider.plural}
            </div>
            <div className="preview-item">
              <strong>Bookings:</strong> {formData.terminology.booking.plural}
            </div>
            <div className="preview-item">
              <strong>Customers:</strong> {formData.terminology.customer.plural}
            </div>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Primary Color</label>
            <input
              type="color"
              name="primaryColor"
              value={formData.primaryColor}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label>Secondary Color</label>
            <input
              type="color"
              name="secondaryColor"
              value={formData.secondaryColor}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="features-section">
          <h3>⚙️ Features</h3>
          <div className="feature-toggle">
            <label>
              <input
                type="checkbox"
                checked={formData.features.requireStaffApproval}
                onChange={(e) => setFormData({
                  ...formData,
                  features: {
                    ...formData.features,
                    requireStaffApproval: e.target.checked
                  }
                })}
              />
              Require {formData.terminology.provider.singular} Approval
            </label>
          </div>
          
          <div className="feature-toggle">
            <label>
              <input
                type="checkbox"
                checked={formData.features.enableOnlinePayment}
                onChange={(e) => setFormData({
                  ...formData,
                  features: {
                    ...formData.features,
                    enableOnlinePayment: e.target.checked
                  }
                })}
              />
              Enable Online Payment
            </label>
          </div>
          
          <div className="feature-toggle">
            <label>
              <input
                type="checkbox"
                checked={formData.features.enableCashPayment}
                onChange={(e) => setFormData({
                  ...formData,
                  features: {
                    ...formData.features,
                    enableCashPayment: e.target.checked
                  }
                })}
              />
              Enable Cash Payment
            </label>
          </div>
        </div>
        
        <button type="submit" className="btn-save">
          💾 Save Configuration
        </button>
      </form>
    </div>
  );
};

export default ConfigSettings;