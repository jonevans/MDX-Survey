import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

import API_URL from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user data if token exists
  useEffect(() => {
    const loadUser = async () => {
      // Check if token exists in local storage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // Set authorization header
        axios.defaults.headers.common['x-auth-token'] = token;
        
        // Get user data
        const res = await axios.get(`${API_URL}/api/auth/me`);
        
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Auth loading error:', err);
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Register user
  const register = async (formData) => {
    try {
      
      // Explicitly set the base URL for this request
      const res = await axios.post(`${API_URL}/api/auth/register`, formData);
      
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      
      setUser(res.data.user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      
      // Extract detailed error information
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Registration failed';
                          
      return { 
        success: false, 
        error: errorMessage,
        details: err.response?.data || err.message
      };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      
      // Save token to local storage
      localStorage.setItem('token', res.data.token);
      
      // Set user data
      setUser(res.data.user);
      setIsAuthenticated(true);
      
      // Set authorization header for future requests
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        register,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
