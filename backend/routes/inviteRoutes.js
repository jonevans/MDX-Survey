const express = require('express');
const router = express.Router();
const {
  createCompanySurvey,
  getCompanySurveys,
  getCompanySurvey,
  addInvites,
  getRegistrationUrls,
  updateSurveyStatus,
  validateInviteToken,
  deleteCompanySurvey
} = require('../controllers/inviteController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Company survey management routes (admin only)
router.post('/surveys', [auth, admin], createCompanySurvey);
router.get('/surveys', [auth, admin], getCompanySurveys);
router.get('/surveys/:id', [auth, admin], getCompanySurvey);
router.patch('/surveys/:id/status', [auth, admin], updateSurveyStatus);
router.delete('/surveys/:id', [auth, admin], deleteCompanySurvey);

// Invite management routes (admin only)
router.post('/surveys/:surveyId/invites', [auth, admin], addInvites);
router.get('/surveys/:surveyId/urls', [auth, admin], getRegistrationUrls);

// Public route for validating invite tokens
router.get('/validate/:token', validateInviteToken);

module.exports = router;