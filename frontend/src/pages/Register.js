import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Logo from '../components/Logo';
import API_URL from '../config/api';

const Register = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    companyName: '',
    department: '',
    jobTitle: ''
  });
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [loading, setLoading] = useState(!!inviteToken);
  const [inviteData, setInviteData] = useState(null);
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const { email, password, fullName, companyName, department, jobTitle } = formData;
  
  // Validate invite token on component mount
  useEffect(() => {
    if (inviteToken) {
      validateInviteToken();
    }
  }, [inviteToken]);
  
  const validateInviteToken = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/invites/validate/${inviteToken}`);
      
      if (response.data.valid) {
        const invite = response.data.invite;
        setInviteData(invite);
        setFormData({
          email: invite.email,
          fullName: invite.fullName,
          companyName: invite.companyName,
          password: '',
          department: '',
          jobTitle: ''
        });
        setError('');
      } else {
        setError('Invalid or expired invitation link');
      }
    } catch (err) {
      console.error('Error validating invite:', err);
      setError('Invalid or expired invitation link');
    } finally {
      setLoading(false);
    }
  };
  
  const onChange = e => {
    // Don't allow editing of pre-filled fields from invite
    if (inviteData && ['email', 'fullName', 'companyName'].includes(e.target.name)) {
      return;
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    setDebugInfo('Starting registration process...');
    
    try {
      // Test the API connection first
      setDebugInfo('Testing API connection...');
      const testResponse = await axios.get(`${API_URL}/api/test`);
      setDebugInfo(`API test successful: ${JSON.stringify(testResponse.data)}`);
      
      // Now try registration
      setDebugInfo('Attempting registration...');
      const registrationData = { ...formData };
      if (inviteToken) {
        registrationData.inviteToken = inviteToken;
      }
      const result = await register(registrationData);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
        setDebugInfo(`Registration failed: ${JSON.stringify(result.details || 'No details available')}`);
      }
    } catch (err) {
      setError('Error connecting to server');
      setDebugInfo(`Connection error: ${err.message}`);
      console.error('Registration error:', err);
    }
  };
  
  // Department options
  const departments = [
    'Executive Leadership',
    'Information Technology',
    'Marketing',
    'Sales',
    'Finance',
    'Human Resources',
    'Operations',
    'Customer Service',
    'Research & Development',
    'Product Management',
    'Legal',
    'Administration',
    'Other'
  ];
  
  // Show loading while validating invite
  if (loading) {
    return (
      <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
          <Logo />
          <h1 style={{ color: '#2D2D2D', textAlign: 'center' }}>Validating Invitation...</h1>
        </div>
      </div>
    );
  }

  // Show error if no invite token and registration is invite-only
  if (!inviteToken && !inviteData) {
    return (
      <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
          <Logo />
          <h1 style={{ color: '#2D2D2D', textAlign: 'center' }}>Registration Requires Invitation</h1>
        </div>
        <div style={{ 
          backgroundColor: '#FFF5F7', 
          color: '#DC0032', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #DC0032',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 15px 0', fontWeight: 'bold' }}>
            Registration is by invitation only
          </p>
          <p style={{ margin: '0 0 15px 0' }}>
            To register for this assessment, you need a valid invitation link from your administrator.
          </p>
          <p style={{ margin: 0 }}>
            Please contact your organization's administrator to request access.
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Link 
            to="/login" 
            style={{ 
              color: '#DC0032', 
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Already have an account? Login here
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
        <Logo />
        <h1 style={{ color: '#2D2D2D', textAlign: 'center' }}>
          {inviteData ? 'Complete Your Registration' : 'Register'}
        </h1>
        {inviteData && (
          <p style={{ color: '#666', textAlign: 'center', margin: 0 }}>
            Welcome to {inviteData.companyName}! Please complete your registration below.
          </p>
        )}
      </div>
      
      {error && (
        <div style={{ 
          backgroundColor: '#FFF5F7', 
          color: '#DC0032', 
          padding: '10px', 
          borderRadius: '3px', 
          marginBottom: '10px',
          border: '1px solid #DC0032'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#2D2D2D' }}>
            Name {inviteData && <small style={{ color: '#666' }}>(from invitation)</small>}
          </label>
          <input
            type="text"
            name="fullName"
            value={fullName}
            onChange={onChange}
            disabled={!!inviteData}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '3px',
              color: '#2D2D2D',
              backgroundColor: inviteData ? '#f8f9fa' : 'white',
              cursor: inviteData ? 'not-allowed' : 'text'
            }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#2D2D2D' }}>
            Company Name {inviteData && <small style={{ color: '#666' }}>(from invitation)</small>}
          </label>
          <input
            type="text"
            name="companyName"
            value={companyName}
            onChange={onChange}
            disabled={!!inviteData}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '3px',
              color: '#2D2D2D',
              backgroundColor: inviteData ? '#f8f9fa' : 'white',
              cursor: inviteData ? 'not-allowed' : 'text'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#2D2D2D' }}>
            Department
          </label>
          <select
            name="department"
            value={department}
            onChange={onChange}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '3px',
              color: '#2D2D2D',
              backgroundColor: 'white'
            }}
            required
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#2D2D2D' }}>
            Job Title
          </label>
          <input
            type="text"
            name="jobTitle"
            value={jobTitle}
            onChange={onChange}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '3px',
              color: '#2D2D2D'
            }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#2D2D2D' }}>
            Email {inviteData && <small style={{ color: '#666' }}>(from invitation)</small>}
          </label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={onChange}
            disabled={!!inviteData}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '3px',
              color: '#2D2D2D',
              backgroundColor: inviteData ? '#f8f9fa' : 'white',
              cursor: inviteData ? 'not-allowed' : 'text'
            }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#2D2D2D' }}>
            Password
          </label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={onChange}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '3px',
              color: '#2D2D2D'
            }}
            required
          />
        </div>
        
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#DC0032',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          {inviteData ? 'Complete Registration' : 'Register'}
        </button>
      </form>
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link 
          to="/login" 
          style={{ 
            color: '#DC0032', 
            textDecoration: 'none' 
          }}
        >
          Already have an account? Login here
        </Link>
      </div>
    </div>
  );
};

export default Register;
