import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { userAPI } from '../services/api';

const ScaleContext = createContext();

export const useScale = () => {
  const context = useContext(ScaleContext);
  if (!context) {
    throw new Error('useScale must be used within a ScaleProvider');
  }
  return context;
};

// Radix UI scaling values per tier
const RADIX_SCALING = {
  small: '100%',
  medium: '105%',
  large: '110%',
};

export const ScaleProvider = ({ children }) => {
  const { user, updateUser, isLoading: authLoading } = useAuth();
  const [scale, setScale] = useState('small');
  const initializedForRef = useRef(undefined);

  // Load scale from user preferences — only once per user session
  useEffect(() => {
    if (authLoading) return;

    const userId = user?._id || null;
    if (initializedForRef.current === userId) return;
    initializedForRef.current = userId;

    if (user?.preferences?.scale) {
      setScale(user.preferences.scale);
    } else {
      setScale('small');
    }
  }, [user, authLoading]);

  // Apply scale to document
  useEffect(() => {
    if (scale === 'small') {
      document.documentElement.removeAttribute('data-scale');
    } else {
      document.documentElement.setAttribute('data-scale', scale);
    }
  }, [scale]);

  const changeScale = async (newScale) => {
    const prev = scale;
    setScale(newScale);

    // Save to backend if user is authenticated
    if (user) {
      try {
        await userAPI.updateProfile({
          preferences: {
            ...user.preferences,
            scale: newScale,
          },
        });
        // Keep AuthContext user in sync
        if (updateUser) {
          updateUser({ preferences: { ...user.preferences, scale: newScale } });
        }
      } catch (error) {
        console.error('Failed to save scale preference:', error);
        // Revert on error
        setScale(prev);
        throw error; // re-throw so callers can show error toast
      }
    }
  };

  const value = {
    scale,
    changeScale,
    radixScaling: RADIX_SCALING[scale] || '100%',
    scaleOptions: [
      { value: 'small', label: 'Small', description: 'Default' },
      { value: 'medium', label: 'Medium', description: 'Comfortable' },
      { value: 'large', label: 'Large', description: 'Spacious' },
    ],
  };

  return (
    <ScaleContext.Provider value={value}>
      {children}
    </ScaleContext.Provider>
  );
};

export default ScaleContext;
