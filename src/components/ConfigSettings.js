import React, { useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import axios from 'axios';
import './ConfigSettings.css';

const ConfigSettings = () => {
  const { config } = useConfig();
  const [formData, setFormData] = useState({
    businessName: config?.businessName || '',
    businessType: config?.businessType || 'salon',
    primaryColor: config?.primaryColor || '#667eea',
    secondaryColor: config?.secondaryColor || '#764ba2'
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      
      setSuccess('✅ Configuration updated! Refresh page to see changes.');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setError('Failed to update configuration');
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
            placeholder="e.g., Hashini's Salon"
          />
        </div>
        
        <div className="form-group">
          <label>Business Type</label>
          <select
            name="businessType"
            value={formData.businessType}
            onChange={handleChange}
          >
            <option value="salon">Salon / Beauty</option>
            <option value="hospital">Hospital / Clinic</option>
            <option value="hotel">Hotel / Resort</option>
            <option value="restaurant">Restaurant</option>
            <option value="gym">Gym / Fitness</option>
          </select>
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
        
        <button type="submit" className="btn-save">
          💾 Save Configuration
        </button>
      </form>
    </div>
  );
};

export default ConfigSettings;