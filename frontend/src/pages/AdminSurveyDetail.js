import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Logo from '../components/Logo';
import API_URL from '../config/api';

const AdminSurveyDetail = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddInvites, setShowAddInvites] = useState(false);
  const [showUrls, setShowUrls] = useState(false);
  const [inviteText, setInviteText] = useState('');
  const [urls, setUrls] = useState([]);

  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchSurveyDetails();
  }, [id]);

  const fetchSurveyDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/invites/surveys/${id}`, {
        headers: { 'x-auth-token': token }
      });

      if (response.data.success) {
        setSurvey(response.data.survey);
        setInvites(response.data.invites);
      }
    } catch (err) {
      console.error('Error fetching survey details:', err);
      setError('Failed to load survey details');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const parseInvites = (text) => {
    const lines = text.trim().split('\n');
    const invites = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Try to parse "Name <email>" format or "email, name" format
      let email, fullName;
      
      if (trimmed.includes('<') && trimmed.includes('>')) {
        // "John Doe <john@example.com>" format
        const match = trimmed.match(/^(.+?)\s*<(.+?)>$/);
        if (match) {
          fullName = match[1].trim();
          email = match[2].trim();
        }
      } else if (trimmed.includes(',')) {
        // "john@example.com, John Doe" format
        const parts = trimmed.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          if (parts[0].includes('@')) {
            email = parts[0];
            fullName = parts.slice(1).join(' ');
          } else if (parts[1].includes('@')) {
            fullName = parts[0];
            email = parts[1];
          }
        }
      } else if (trimmed.includes('@')) {
        // Just email
        email = trimmed;
        fullName = email.split('@')[0]; // Use part before @ as name
      }
      
      if (email && fullName) {
        invites.push({ email, fullName });
      }
    }
    
    return invites;
  };

  const handleAddInvites = async (e) => {
    e.preventDefault();
    
    const parsedInvites = parseInvites(inviteText);
    
    
    if (parsedInvites.length === 0) {
      alert('No valid invites found. Please use format:\n"John Doe <john@example.com>" or "john@example.com, John Doe"');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_URL}/api/invites/surveys/${id}/invites`, 
        { invites: parsedInvites },
        { headers: { 'x-auth-token': token } }
      );

      if (response.data.success) {
        setShowAddInvites(false);
        setInviteText('');
        fetchSurveyDetails();
        
        if (response.data.errors && response.data.errors.length > 0) {
          alert(`Added ${response.data.invites.length} invites successfully.\n\nWarnings:\n${response.data.errors.join('\n')}`);
        } else {
          alert(`Successfully added ${response.data.invites.length} invites!`);
        }
      }
    } catch (err) {
      console.error('Error adding invites:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error occurred';
      alert(`Failed to add invites: ${errorMessage}`);
    }
  };

  const handleGetUrls = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/invites/surveys/${id}/urls`, {
        headers: { 'x-auth-token': token }
      });

      if (response.data.success) {
        setUrls(response.data.urls);
        setShowUrls(true);
      }
    } catch (err) {
      console.error('Error getting URLs:', err);
      alert('Failed to get registration URLs');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'registered': return '#28a745';
      case 'completed': return '#007bff';
      case 'expired': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading survey details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
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
            }}>Survey Management</h1>
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
            to="/admin/surveys" 
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
            Back to Surveys
          </Link>
        </div>
      </div>

      {/* Survey Details */}
      {survey && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '30px' }}>
          <h2 style={{ color: '#2D2D2D', marginBottom: '15px' }}>Survey Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p><strong>Company:</strong> {survey.companyName}</p>
              <p><strong>Title:</strong> {survey.title}</p>
              <p><strong>Description:</strong> {survey.description || 'No description'}</p>
            </div>
            <div>
              <p><strong>Status:</strong> 
                <span style={{
                  marginLeft: '10px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: getStatusColor(survey.status),
                  color: 'white'
                }}>
                  {survey.status.toUpperCase()}
                </span>
              </p>
              <p><strong>Created:</strong> {new Date(survey.createdAt).toLocaleString()}</p>
              <p><strong>Expires:</strong> {new Date(survey.expiresAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowAddInvites(!showAddInvites)}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          {showAddInvites ? 'Cancel' : '+ Add Invites'}
        </button>
        
        {invites.filter(i => i.status === 'pending').length > 0 && (
          <button
            onClick={handleGetUrls}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Get Registration URLs
          </button>
        )}
      </div>

      {/* Add Invites Form */}
      {showAddInvites && (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          padding: '20px', 
          marginBottom: '30px' 
        }}>
          <h3 style={{ marginTop: 0, color: '#2D2D2D' }}>Add Invites</h3>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Enter invites one per line using one of these formats:<br/>
            • "John Doe &lt;john@example.com&gt;"<br/>
            • "john@example.com, John Doe"<br/>
            • "john@example.com" (will use part before @ as name)
          </p>
          <form onSubmit={handleAddInvites}>
            <textarea
              value={inviteText}
              onChange={(e) => setInviteText(e.target.value)}
              placeholder="John Doe <john@example.com>&#10;jane@example.com, Jane Smith&#10;bob@example.com"
              rows="8"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
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
                Add Invites
              </button>
              <button
                type="button"
                onClick={() => setShowAddInvites(false)}
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

      {/* Registration URLs */}
      {showUrls && urls.length > 0 && (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          padding: '20px', 
          marginBottom: '30px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#2D2D2D' }}>Registration URLs</h3>
            <button
              onClick={() => setShowUrls(false)}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Hide URLs
            </button>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {urls.map((urlData, index) => (
              <div key={index} style={{ 
                marginBottom: '15px', 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>{urlData.fullName}</strong> ({urlData.email})
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  backgroundColor: 'white',
                  padding: '8px',
                  borderRadius: '3px',
                  border: '1px solid #dee2e6'
                }}>
                  <code style={{ 
                    flex: 1, 
                    fontSize: '12px', 
                    wordBreak: 'break-all',
                    margin: 0
                  }}>
                    {urlData.url}
                  </code>
                  <button
                    onClick={() => copyToClipboard(urlData.url)}
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invites List */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
        <h2 style={{ color: '#2D2D2D', marginBottom: '20px' }}>
          Invites ({invites.length})
        </h2>
        
        {invites.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            No invites added yet. Click "Add Invites" to get started.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Created</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Registered</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{invite.fullName}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{invite.email}</td>
                    <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: getStatusColor(invite.status),
                        color: 'white'
                      }}>
                        {invite.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      {new Date(invite.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      {invite.registeredAt ? new Date(invite.registeredAt).toLocaleDateString() : '-'}
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

export default AdminSurveyDetail;