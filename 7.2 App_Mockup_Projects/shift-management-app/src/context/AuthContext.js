import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set auth token in axios headers
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      localStorage.removeItem('token');
    }
  };

  // Load user if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        setAuthToken(token);
        
        try {
          const res = await axios.get('/api/users/me');
          setUser(res.data);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Error loading user:', err.response?.data?.msg || err.message);
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
          setAuthToken(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Google Sign In
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would use Firebase or another auth provider
      // For this mockup, we'll simulate a successful login
      const mockUser = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        authProvider: 'google',
        authId: 'google-123456789'
      };
      
      // Send auth data to backend
      const res = await axios.post('/api/users/auth', mockUser);
      
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      setAuthToken(res.data.token);
      
      return res.data.user;
    } catch (err) {
      setError(err.response?.data?.msg || 'Authentication failed');
      console.error('Google Sign In Error:', err.response?.data || err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Microsoft Sign In
  const signInWithMicrosoft = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would use MSAL or another auth provider
      // For this mockup, we'll simulate a successful login
      const mockUser = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        authProvider: 'microsoft',
        authId: 'microsoft-987654321'
      };
      
      // Send auth data to backend
      const res = await axios.post('/api/users/auth', mockUser);
      
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      setAuthToken(res.data.token);
      
      return res.data.user;
    } catch (err) {
      setError(err.response?.data?.msg || 'Authentication failed');
      console.error('Microsoft Sign In Error:', err.response?.data || err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign Out
  const signOut = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthToken(null);
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.put(`/api/users/${user._id}`, userData);
      
      setUser(res.data);
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update profile');
      console.error('Update Profile Error:', err.response?.data || err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    signInWithGoogle,
    signInWithMicrosoft,
    signOut,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
