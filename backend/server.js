const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const { apiLimiter } = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Trust proxy for rate limiting (required for Render deployment)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com"],
    },
  },
}));

// Apply rate limiting to all requests (temporarily disabled for testing)
// app.use(apiLimiter);

// Middleware
app.use(express.json({ limit: '10mb' }));
// Determine frontend URL based on environment
const frontendUrl = process.env.FRONTEND_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://dx-assessment-frontend.onrender.com' : 'http://localhost:3000');

app.use(cors({
  origin: frontendUrl,
  credentials: true,
  optionsSuccessStatus: 200
}));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dx-assessment')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
  });

// Routes - api.js handles most routes internally
app.use('/api', require('./routes/api'));
// Additional standalone routes
app.use('/api/invites', require('./routes/inviteRoutes'));

// Simple test route
app.get('/api/test', (req, res) => {
  console.log('Test API called');
  res.json({ message: 'Backend API working!' });
});

// Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
