/**
 * Middleware to check if user is an admin
 * This should be used after the auth middleware
 */
module.exports = function(req, res, next) {
  // Check if user exists and is an admin
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  
  next();
}; 