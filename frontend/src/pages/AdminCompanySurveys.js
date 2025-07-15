import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Logo from '../components/Logo';
import API_URL from '../config/api';

const AdminCompanySurveys = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    title: '',
    description: '',
    expiresAt: ''
  });

  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/invites/surveys`, {
        headers: { 'x-auth-token': token }
      });

      if (response.data.success) {
        setSurveys(response.data.surveys);
      }
    } catch (err) {
      console.error('Error fetching surveys:', err);
      setError('Failed to load company surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateSurvey = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/invites/surveys`, formData, {
        headers: { 'x-auth-token': token }
      });

      if (response.data.success) {
        setShowCreateForm(false);
        setFormData({
          companyName: '',
          title: '',
          description: '',
          expiresAt: ''
        });
        fetchSurveys();
      }
    } catch (err) {
      console.error('Error creating survey:', err);
      alert('Failed to create survey');
    }
  };

  const handleStatusChange = async (surveyId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/invites/surveys/${surveyId}/status`, 
        { status: newStatus },
        { headers: { 'x-auth-token': token } }
      );
      fetchSurveys();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update survey status');
    }
  };

  const handleDeleteSurvey = async (surveyId) => {
    if (!window.confirm('Are you sure you want to delete this survey and all its invites?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/invites/surveys/${surveyId}`, {
        headers: { 'x-auth-token': token }
      });
      fetchSurveys();
    } catch (err) {
      console.error('Error deleting survey:', err);
      alert('Failed to delete survey');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#6c757d';
      case 'active': return '#28a745';
      case 'completed': return '#007bff';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading company surveys...</div>
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
            }}>Company Surveys</h1>
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
              fontWeight: '500'
            }}
          >
            Dashboard
          </Link>
          <Link 
            to="/admin/responses" 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#f8f9fa', 
              color: '#2D2D2D', 
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: '500'
            }}
          >
            All Responses
          </Link>
          <Link 
            to="/admin/companies" 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#f8f9fa', 
              color: '#2D2D2D', 
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: '500'
            }}
          >
            All Companies
          </Link>
          <span style={{ 
            padding: '10px 20px', 
            backgroundColor: '#DC0032', 
            color: 'white', 
            borderRadius: '4px',
            fontWeight: '500'
          }}>
            Company Surveys
          </span>
        </div>
      </div>

      {/* Create Survey Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            backgroundColor: '#DC0032',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '16px'
          }}
        >
          {showCreateForm ? 'Cancel' : '+ Create New Survey'}
        </button>
      </div>

      {/* Create Survey Form */}
      {showCreateForm && (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          padding: '20px', 
          marginBottom: '30px' 
        }}>
          <h3 style={{ marginTop: 0, color: '#2D2D2D' }}>Create New Company Survey</h3>
          <form onSubmit={handleCreateSurvey}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Company Name *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Survey Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Expires At</label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Create Survey
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '15px', 
          borderRadius: '4px', 
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {/* Surveys List */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
        <h2 style={{ color: '#2D2D2D', marginBottom: '20px' }}>All Company Surveys</h2>
        
        {surveys.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            No company surveys found. Create your first survey to get started.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Company</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Title</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Invites</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Completed</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Created</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {surveys.map((survey) => (
                  <tr key={survey._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{survey.companyName}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>{survey.title}</div>
                        {survey.description && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                            {survey.description.substring(0, 50)}...
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: getStatusColor(survey.status),
                        color: 'white'
                      }}>
                        {survey.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>{survey.inviteCount}</td>
                    <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>{survey.completedCount}</td>
                    <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      {new Date(survey.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link
                          to={`/admin/surveys/${survey._id}`}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '3px',
                            fontSize: '12px'
                          }}
                        >
                          Manage
                        </Link>
                        {survey.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(survey._id, 'active')}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Activate
                          </button>
                        )}
                        {survey.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange(survey._id, 'completed')}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSurvey(survey._id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCompanySurveys;