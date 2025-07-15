const { body, param, validationResult } = require('express-validator');
const xss = require('xss');
const mongoose = require('mongoose');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Create a more user-friendly error message
    const errorMessages = errors.array().map(error => error.msg);
    const detailedMessage = errorMessages.join('. ');
    
    return res.status(400).json({
      message: `Please fix the following issues: ${detailedMessage}`,
      errors: errors.array()
    });
  }
  next();
};

// Sanitize text inputs to prevent XSS
const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  return xss(value, {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  });
};

// Custom sanitization middleware
const sanitizeBody = (fields) => {
  return (req, res, next) => {
    fields.forEach(field => {
      if (req.body[field]) {
        req.body[field] = sanitizeInput(req.body[field]);
      }
    });
    next();
  };
};

// Validation rules for user registration
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must include: at least one uppercase letter (A-Z), one lowercase letter (a-z), and one number (0-9)'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('companyName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('department')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Department must be between 2 and 100 characters'),
  body('jobTitle')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Job title must be between 2 and 100 characters'),
  sanitizeBody(['fullName', 'companyName', 'department', 'jobTitle']),
  handleValidationErrors
];

// Validation rules for user login
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Validation for response saving
const validateResponseSave = [
  param('id')
    .custom(value => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid response ID');
      }
      return true;
    }),
  body('answers')
    .optional()
    .isObject()
    .withMessage('Answers must be an object'),
  body('categoryFeedback')
    .optional()
    .isObject()
    .withMessage('Category feedback must be an object'),
  body('sectionProgress')
    .optional()
    .isObject()
    .withMessage('Section progress must be an object'),
  // Custom sanitization for nested feedback objects
  (req, res, next) => {
    if (req.body.categoryFeedback) {
      Object.keys(req.body.categoryFeedback).forEach(category => {
        const feedback = req.body.categoryFeedback[category];
        if (feedback.strengths) {
          feedback.strengths = sanitizeInput(feedback.strengths);
        }
        if (feedback.challenges) {
          feedback.challenges = sanitizeInput(feedback.challenges);
        }
        if (feedback.context) {
          feedback.context = sanitizeInput(feedback.context);
        }
        if (feedback.examples) {
          feedback.examples = sanitizeInput(feedback.examples);
        }
      });
    }
    next();
  },
  handleValidationErrors
];

// Validation for response completion
const validateResponseComplete = [
  param('id')
    .custom(value => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid response ID');
      }
      return true;
    }),
  body('answers')
    .isArray()
    .withMessage('Answers must be an array')
    .custom(answers => {
      // Validate each answer object
      answers.forEach(answer => {
        if (!answer.questionId || !answer.category || answer.score === undefined) {
          throw new Error('Each answer must have questionId, category, and score');
        }
        if (!Number.isInteger(answer.questionId) || answer.questionId < 1) {
          throw new Error('Question ID must be a positive integer');
        }
        if (!Number.isInteger(answer.score) || answer.score < 0 || answer.score > 5) {
          throw new Error('Score must be an integer between 0 and 5');
        }
      });
      return true;
    }),
  body('categoryFeedback')
    .optional()
    .isObject()
    .withMessage('Category feedback must be an object'),
  // Custom sanitization for nested feedback objects
  (req, res, next) => {
    if (req.body.categoryFeedback) {
      Object.keys(req.body.categoryFeedback).forEach(category => {
        const feedback = req.body.categoryFeedback[category];
        if (feedback.strengths) {
          feedback.strengths = sanitizeInput(feedback.strengths);
        }
        if (feedback.challenges) {
          feedback.challenges = sanitizeInput(feedback.challenges);
        }
        if (feedback.context) {
          feedback.context = sanitizeInput(feedback.context);
        }
        if (feedback.examples) {
          feedback.examples = sanitizeInput(feedback.examples);
        }
      });
    }
    next();
  },
  handleValidationErrors
];

// Validation for AI analysis
const validateAIAnalysis = [
  body('prompt')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Prompt must be between 10 and 5000 characters'),
  sanitizeBody(['prompt']),
  handleValidationErrors
];

// Validation for AI insights generation
const validateAIInsights = [
  body('assessmentData')
    .isObject()
    .withMessage('Assessment data must be an object'),
  body('assessmentData.maturityLevel')
    .exists()
    .withMessage('Maturity level is required'),
  body('assessmentData.scoringSummary')
    .exists()
    .withMessage('Scoring summary is required'),
  handleValidationErrors
];

// Validation for MongoDB ObjectId parameters
const validateObjectId = (paramName) => [
  param(paramName)
    .custom(value => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid ${paramName}`);
      }
      return true;
    }),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateResponseSave,
  validateResponseComplete,
  validateAIAnalysis,
  validateAIInsights,
  validateObjectId,
  sanitizeInput,
  sanitizeBody,
  handleValidationErrors
};