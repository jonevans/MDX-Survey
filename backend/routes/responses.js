const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const responseController = require('../controllers/responseController');
const { validateResponseSave, validateResponseComplete, validateObjectId } = require('../middleware/validation');

/**
 * @route   POST /api/responses/start
 * @desc    Start a new assessment response
 * @access  Private
 */
router.post('/start', auth, responseController.startResponse);

/**
 * @route   PUT /api/responses/:id/save
 * @desc    Save partial response data
 * @access  Private
 */
router.put('/:id/save', auth, validateResponseSave, responseController.savePartialResponse);

/**
 * @route   PUT /api/responses/:id/complete
 * @desc    Complete a response and generate scores
 * @access  Private
 */
router.put('/:id/complete', auth, validateResponseComplete, responseController.completeResponse);

/**
 * @route   GET /api/responses/my
 * @desc    Get all responses for the current user
 * @access  Private
 */
router.get('/my', auth, responseController.getUserResponses);

/**
 * @route   GET /api/responses/:id
 * @desc    Get a specific response by ID
 * @access  Private
 */
router.get('/:id', auth, validateObjectId('id'), responseController.getResponseById);

module.exports = router;
