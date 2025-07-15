const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  // Check if JWT_SECRET is configured
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET environment variable is not configured');
    return res.status(500).json({ message: 'Server configuration error' });
  }
  
  try {
    // Verify token with proper error handling
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validate token structure
    if (!decoded.user || !decoded.user.id) {
      return res.status(401).json({ message: 'Invalid token structure' });
    }
    
    // Add user from payload to request
    req.user = decoded.user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else {
      console.error('JWT verification error:', err);
      return res.status(401).json({ message: 'Token verification failed' });
    }
  }
};
