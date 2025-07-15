import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Logo from '../components/Logo';
import API_URL from '../config/api';

const AdminResponses = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [deleteError, setDeleteError] = useState({});

  useEffect(() => {
    // Redirect if not admin
    if (user && !user.isAdmin) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_URL}/api/admin/responses`, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        setResponses(response.data);
      }
    } catch (err) {
      console.error('Error fetching responses:', err);
      setError('Failed to load responses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.isAdmin) {
      fetchResponses();
    }
  }, [user]);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDelete = async (responseId) => {
    try {
      setDeleteLoading(prev => ({ ...prev, [responseId]: true }));
      setDeleteError(prev => ({ ...prev, [responseId]: null }));

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Show confirmation dialog
      if (!window.confirm('Are you sure you want to delete this response? This action cannot be undone.')) {
        return;
      }

      await axios.delete(`${API_URL}/api/admin/responses/${responseId}`, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      // Refresh the responses list
      fetchResponses();
    } catch (err) {
      console.error('Error deleting response:', err);
      setDeleteError(prev => ({ 
        ...prev, 
        [responseId]: 'Failed to delete response'
      }));
    } finally {
      setDeleteLoading(prev => ({ ...prev, [responseId]: false }));
    }
  };
  
  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Logo />
          <button 
            onClick={handleLogout}
            style={{
              backgroundColor: '#DC0032',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading responses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Logo />
          <button 
            onClick={handleLogout}
            style={{
              backgroundColor: '#DC0032',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Logo />
            <h1 style={{ 
              color: '#2D2D2D', 
              margin: 0,
              fontSize: '24px',
              fontWeight: 'bold'
            }}>All Responses</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ 
              color: '#2D2D2D',
              fontWeight: '500'
            }}>Admin: {user?.fullName}</span>
            <button 
              onClick={handleLogout}
              style={{
                backgroundColor: '#DC0032',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div style={{ 
          display: 'flex',
          gap: '10px'
        }}>
          <Link 
            to="/admin" 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#f8f9fa', 
              color: '#2D2D2D', 
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span style={{ fontSize: '18px' }}>←</span>
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      {/* Responses Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>Company</th>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>User</th>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>Department</th>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>Job Title</th>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>Completion Date</th>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>Score</th>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {responses.length > 0 ? (
              responses.map((response) => (
                <tr key={response._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px 15px' }}>{response.companyName}</td>
                  <td style={{ padding: '12px 15px' }}>{response.userDetails?.fullName || 'Unknown'}</td>
                  <td style={{ padding: '12px 15px' }}>{response.userDetails?.department || 'N/A'}</td>
                  <td style={{ padding: '12px 15px' }}>{response.userDetails?.jobTitle || 'N/A'}</td>
                  <td style={{ padding: '12px 15px' }}>{new Date(response.completionDate).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 15px' }}>{response.scoringSummary?.totalScore || 'N/A'}</td>
                  <td style={{ padding: '12px 15px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Link 
                        to={`/admin/responses/${response._id}`}
                        style={{ 
                          backgroundColor: '#DC0032', 
                          color: 'white', 
                          padding: '5px 10px', 
                          borderRadius: '4px', 
                          textDecoration: 'none',
                          fontSize: '14px'
                        }}
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => handleDelete(response._id)}
                        disabled={deleteLoading[response._id]}
                        style={{ 
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: deleteLoading[response._id] ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          opacity: deleteLoading[response._id] ? 0.7 : 1
                        }}
                      >
                        {deleteLoading[response._id] ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                    {deleteError[response._id] && (
                      <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                        {deleteError[response._id]}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ padding: '12px 15px', textAlign: 'center' }}>No responses found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminResponses; 