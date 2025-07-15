const express = require('express');
const router = express.Router();

// Auth routes
router.use('/auth', require('./auth'));

// Survey routes
router.use('/survey', require('./survey'));

// Response routes
router.use('/responses', require('./responses'));

// Report routes
router.use('/reports', require('./reports'));

// Admin routes
router.use('/admin', require('./admin'));

// AI routes
router.use('/ai', require('./aiRoutes'));

module.exports = router;
