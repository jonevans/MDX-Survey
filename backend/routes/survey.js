const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const surveyData = require('../config/surveyData');

/**
 * @route   GET /api/survey
 * @desc    Get survey structure for the assessment
 * @access  Private
 */
router.get('/', auth, (req, res) => {
  try {
    // Create a sanitized version of the survey data
    // that doesn't include internal information like weight factors
    const sanitizedData = {
      categories: surveyData.categories,
      questions: surveyData.questions.map(question => ({
        id: question.id,
        text: question.text,
        category: question.category
      })),
      responseValues: surveyData.scoring.responseValues
    };
    
    res.json(sanitizedData);
  } catch (error) {
    console.error('Error fetching survey structure:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
