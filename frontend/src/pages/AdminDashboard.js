import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Logo from '../components/Logo';
import API_URL from '../config/api';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalUsers: 0,
    totalResponses: 0,
    completionRate: 0
  });
  const [recentResponses, setRecentResponses] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Redirect if not admin
    if (user && !user.isAdmin) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the auth token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get(`${API_URL}/api/admin/dashboard`, {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });

        if (response.data) {
          setStats(response.data.stats);
          setRecentResponses(response.data.recentResponses);
          setTopCompanies(response.data.topCompanies);
        }
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load admin dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.isAdmin) {
      fetchAdminData();
    }
  }, [user]);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Helper function to format maturity level and score
  const formatMaturityScore = (score) => {
    if (!score) return 'N/A';
    
    const maturityLevels = [
      { level: "Absent", range: [0, 27] },
      { level: "Limited", range: [28, 55] },
      { level: "Emerging", range: [56, 77] },
      { level: "Applied", range: [78, 98] },
      { level: "Strategic", range: [99, 125] },
      { level: "Innovative", range: [126, 135] }
    ];
    
    const level = maturityLevels.find(
      level => score >= level.range[0] && score <= level.range[1]
    );
    
    return `${level ? level.level : 'N/A'} (${Math.round(score)}/135)`;
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
        <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading admin dashboard...</div>
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
      
      <h1 style={{ color: '#2D2D2D', marginBottom: '30px' }}>Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div style={{ flex: 1, padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', margin: '0 10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2D2D2D' }}>Companies</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#DC0032' }}>{stats.totalCompanies}</p>
        </div>
        <div style={{ flex: 1, padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', margin: '0 10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2D2D2D' }}>Users</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#DC0032' }}>{stats.totalUsers}</p>
        </div>
        <div style={{ flex: 1, padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', margin: '0 10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2D2D2D' }}>Responses</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#DC0032' }}>{stats.totalResponses}</p>
        </div>
        <div style={{ flex: 1, padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', margin: '0 10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2D2D2D' }}>Completion Rate</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#DC0032' }}>{stats.completionRate.toFixed(1)}%</p>
        </div>
      </div>
      
      {/* Navigation */}
      <div style={{ display: 'flex', marginBottom: '30px' }}>
        <Link 
          to="/admin/companies" 
          style={{ 
            flex: 1, 
            padding: '15px', 
            backgroundColor: '#DC0032', 
            color: 'white', 
            textAlign: 'center', 
            textDecoration: 'none',
            borderRadius: '4px',
            margin: '0 10px',
            fontWeight: 'bold'
          }}
        >
          View All Companies
        </Link>
        <Link 
          to="/admin/responses" 
          style={{ 
            flex: 1, 
            padding: '15px', 
            backgroundColor: '#DC0032', 
            color: 'white', 
            textAlign: 'center', 
            textDecoration: 'none',
            borderRadius: '4px',
            margin: '0 10px',
            fontWeight: 'bold'
          }}
        >
          View All Responses
        </Link>
        <Link 
          to="/admin/surveys" 
          style={{ 
            flex: 1, 
            padding: '15px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            textAlign: 'center', 
            textDecoration: 'none',
            borderRadius: '4px',
            margin: '0 10px',
            fontWeight: 'bold'
          }}
        >
          🚀 Company Surveys
        </Link>
      </div>
      
      {/* Recent Responses */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#2D2D2D', marginBottom: '15px' }}>Recent Responses</h2>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                <th style={{ padding: '12px 15px', textAlign: 'left' }}>User</th>
                <th style={{ padding: '12px 15px', textAlign: 'left' }}>Company</th>
                <th style={{ padding: '12px 15px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '12px 15px', textAlign: 'left' }}>Score</th>
                <th style={{ padding: '12px 15px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentResponses.length > 0 ? (
                recentResponses.map((response) => (
                  <tr key={response._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px 15px' }}>{response.userDetails?.fullName || 'Unknown'}</td>
                    <td style={{ padding: '12px 15px' }}>{response.companyName}</td>
                    <td style={{ padding: '12px 15px' }}>{new Date(response.completionDate).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 15px' }}>{response.scoringSummary?.totalScore ? response.scoringSummary.totalScore.toFixed(2) : 'N/A'}</td>
                    <td style={{ padding: '12px 15px' }}>
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
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '12px 15px', textAlign: 'center' }}>No recent responses</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Top Companies */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
        <h2 style={{ color: '#2D2D2D', marginBottom: '20px' }}>Top Companies</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e9ecef' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#2D2D2D' }}>Company</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#2D2D2D' }}>Responses</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#2D2D2D' }}>Users</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#2D2D2D' }}>DX Maturity</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#2D2D2D' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {topCompanies.map((company, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '12px', color: '#2D2D2D' }}>{company.name}</td>
                  <td style={{ padding: '12px', color: '#2D2D2D' }}>{company.responseCount}</td>
                  <td style={{ padding: '12px', color: '#2D2D2D' }}>{company.userCount || 'N/A'}</td>
                  <td style={{ padding: '12px', color: '#2D2D2D' }}>
                    {formatMaturityScore(company.aggregatedScores?.averageTotal)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <Link
                      to={`/admin/companies/${encodeURIComponent(company.name)}`}
                      style={{
                        backgroundColor: '#DC0032',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 