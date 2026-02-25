import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const ConfigContext = createContext();

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
};

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchConfig();
  }, []);
  
  const fetchConfig = async () => {
    try {
      const response = await axios.get(
        'https://appointment-backend-wpie.vercel.app/api/config'
      );
      setConfig(response.data);
      
      // Apply branding
      document.title = response.data.businessName;
      document.documentElement.style.setProperty(
        '--primary-color', 
        response.data.primaryColor
      );
      
    } catch (error) {
      console.error('Config fetch error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper to get dynamic labels
  const getLabel = (entity, count = 1) => {
    if (!config) return entity;
    const term = config.terminology[entity];
    return count === 1 ? term.singular : term.plural;
  };
  
  // Helper to check features
  const hasFeature = (feature) => {
    return config?.features?.[feature] === true;
  };
  
  return (
    <ConfigContext.Provider value={{
      config,
      loading,
      getLabel,
      hasFeature
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export default ConfigContext;