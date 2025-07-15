import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Logo from '../components/Logo';
import API_URL from '../config/api';

const AdminCompanies = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Redirect if not admin
    if (user && !user.isAdmin) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the auth token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get(`${API_URL}/api/admin/companies`, {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });

        if (response.data && Array.isArray(response.data)) {
          setCompanies(response.data);
        } else {
          setCompanies([]);
        }
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError('Failed to load companies');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.isAdmin) {
      fetchCompanies();
    }
  }, [user]);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
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
        <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading companies...</div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Logo />
        <div>
          <span style={{ marginRight: '20px' }}>Admin: {user?.fullName}</span>
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
      </div>
      
      {/* Navigation */}
      <div style={{ display: 'flex', marginBottom: '30px' }}>
        <Link 
          to="/admin" 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#f8f9fa', 
            color: '#2D2D2D', 
            textDecoration: 'none',
            borderRadius: '4px',
            marginRight: '10px',
            fontWeight: 'bold'
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>
      
      <h1 style={{ color: '#2D2D2D', marginBottom: '30px' }}>All Companies</h1>
      
      {/* Companies Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>Company Name</th>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>Responses</th>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>Users</th>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>Completion Rate</th>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>Avg. Score</th>
            </tr>
          </thead>
          <tbody>
            {companies.length > 0 ? (
              companies.map((company) => (
                <tr key={company._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px 15px' }}>{company.name}</td>
                  <td style={{ padding: '12px 15px' }}>{company.responseCount}</td>
                  <td style={{ padding: '12px 15px' }}>{company.userCount}</td>
                  <td style={{ padding: '12px 15px' }}>{company.completionRate.toFixed(1)}%</td>
                  <td style={{ padding: '12px 15px' }}>{company.aggregatedScores?.totalScore?.toFixed(1) || 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: '12px 15px', textAlign: 'center' }}>No companies found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCompanies; 