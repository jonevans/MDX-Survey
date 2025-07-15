const express = require('express');
const router = express.Router();
const { analyzeResponse, generateInsights, analyzeCompleteResponse } = require('../controllers/aiController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { validateAIAnalysis, validateAIInsights } = require('../middleware/validation');
const { aiLimiter } = require('../middleware/rateLimiter');

// Protected route - requires authentication and admin privileges
router.post('/analyze', [aiLimiter, auth, admin, validateAIAnalysis], analyzeResponse);

// Protected route - requires authentication for insights generation
router.post('/generate-insights', aiLimiter, auth, validateAIInsights, generateInsights);

// Comprehensive analysis route - admin only
router.post('/analyze-complete', [aiLimiter, auth, admin], analyzeCompleteResponse);

module.exports = router; 