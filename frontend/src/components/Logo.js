import React from 'react';
import logoImage from '../assets/logo_org.jpg';

const Logo = () => (
  <img src={logoImage} alt="Impact Logo" style={{ width: '24px', height: '20px', objectFit: 'contain' }} />
);

export default Logo; 