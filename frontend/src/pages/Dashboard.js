import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Logo from '../components/Logo';
import API_URL from '../config/api';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the auth token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get(`${API_URL}/api/responses`, {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });

        if (response.data && Array.isArray(response.data)) {
          // Sort responses by completion date, most recent first
          const sortedResponses = response.data.sort((a, b) => 
            new Date(b.completionDate) - new Date(a.completionDate)
          );
          setResponses(sortedResponses);
        } else {
          setResponses([]);
        }
      } catch (err) {
        console.error('Error fetching responses:', err);
        setError('Failed to load your previous assessments');
        setResponses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const startNewAssessment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Try to start a new assessment
      const response = await axios.post(`${API_URL}/api/responses/start`, {}, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.response) {
        // Successfully started/continued assessment
        navigate('/assessment/new');
      }
    } catch (err) {
      console.error('Error starting assessment:', err);
      alert('Unable to start assessment. Please try again.');
    }
  };
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex' }}>
            <Logo />
          </div>
          <h1 style={{ color: '#2D2D2D' }}>Digital Transformation Assessment</h1>
        </div>
        <div>
          <span style={{ marginRight: '15px', color: '#2D2D2D' }}>{user?.fullName}</span>
          <button 
            onClick={handleLogout}
            style={{ 
              padding: '8px 15px', 
              backgroundColor: '#2D2D2D', 
              color: 'white', 
              border: 'none', 
              borderRadius: '3px', 
              cursor: 'pointer' 
            }}
          >
            Logout
          </button>
        </div>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <h2 style={{ color: '#2D2D2D' }}>Welcome, {user?.fullName}!</h2>
        <p style={{ color: '#2D2D2D' }}><strong>Company:</strong> {user?.companyName}</p>
        <p style={{ color: '#2D2D2D' }}><strong>Department:</strong> {user?.department}</p>
        <p style={{ color: '#2D2D2D' }}><strong>Job Title:</strong> {user?.jobTitle}</p>
        
        <div style={{ marginTop: '30px' }}>
          <button
            onClick={startNewAssessment}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#DC0032', 
              color: 'white', 
              border: 'none', 
              borderRadius: '3px', 
              cursor: 'pointer', 
              marginRight: '10px' 
            }}
          >
            {responses.length === 0 
              ? 'Start New Assessment'
              : responses.some(r => !r.isCompleted) 
                ? 'Continue Assessment' 
                : 'Edit Assessment'
            }
          </button>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
            {responses.length === 0 
              ? 'Complete your digital transformation assessment to get personalized insights and recommendations.'
              : responses.some(r => r.isCompleted)
                ? 'You can edit your assessment at any time to update your responses and get fresh insights.'
                : 'Continue where you left off to complete your assessment.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
