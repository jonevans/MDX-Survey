const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const reportController = require('../controllers/reportController');

/**
 * @route   GET /api/reports/:responseId
 * @desc    Get a full report for a completed response
 * @access  Private
 */
router.get('/:responseId', auth, reportController.getReport);

/**
 * @route   GET /api/reports/:responseId/company-comparison
 * @desc    Get company comparison data
 * @access  Private
 */
router.get('/:responseId/company-comparison', auth, reportController.getCompanyComparison);

module.exports = router;
