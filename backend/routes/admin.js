const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const adminMiddleware = require('../middleware/admin');

/**
 * @route   GET /api/admin/companies
 * @desc    Get all companies
 * @access  Admin only
 */
router.get('/companies', [auth, adminMiddleware], adminController.getAllCompanies);

/**
 * @route   GET /api/admin/companies/:name
 * @desc    Get company details including all responses
 * @access  Admin only
 */
router.get('/companies/:name', [auth, adminMiddleware], adminController.getCompanyDetails);

/**
 * @route   GET /api/admin/responses
 * @desc    Get all responses across all companies
 * @access  Admin only
 */
router.get('/responses', [auth, adminMiddleware], adminController.getAllResponses);

/**
 * @route   GET /api/admin/responses/:id
 * @desc    Get detailed response data including all answers and feedback
 * @access  Admin only
 */
router.get('/responses/:id', [auth, adminMiddleware], adminController.getResponseDetails);

/**
 * @route   DELETE /api/admin/responses/:id
 * @desc    Delete a response
 * @access  Admin only
 */
router.delete('/responses/:id', [auth, adminMiddleware], adminController.deleteResponse);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get summary statistics for admin dashboard
 * @access  Admin only
 */
router.get('/dashboard', [auth, adminMiddleware], adminController.getDashboardStats);

module.exports = router; 