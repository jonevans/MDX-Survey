const CompanySurvey = require('../models/CompanySurvey');
const UserInvite = require('../models/UserInvite');
const User = require('../models/User');

// Create a new company survey
const createCompanySurvey = async (req, res) => {
  try {
    const { companyName, title, description, expiresAt } = req.body;

    if (!companyName || !title) {
      return res.status(400).json({ error: 'Company name and title are required' });
    }

    const companySurvey = new CompanySurvey({
      companyName: companyName.trim(),
      title: title.trim(),
      description: description?.trim(),
      createdBy: req.user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    await companySurvey.save();

    res.status(201).json({
      success: true,
      companySurvey
    });
  } catch (error) {
    console.error('Error creating company survey:', error);
    res.status(500).json({ error: 'Failed to create company survey' });
  }
};

// Get all company surveys
const getCompanySurveys = async (req, res) => {
  try {
    const surveys = await CompanySurvey.find()
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      surveys
    });
  } catch (error) {
    console.error('Error fetching company surveys:', error);
    res.status(500).json({ error: 'Failed to fetch company surveys' });
  }
};

// Get a specific company survey with its invites
const getCompanySurvey = async (req, res) => {
  try {
    const { id } = req.params;

    const survey = await CompanySurvey.findById(id)
      .populate('createdBy', 'fullName email');

    if (!survey) {
      return res.status(404).json({ error: 'Company survey not found' });
    }

    const invites = await UserInvite.find({ companySurvey: id })
      .populate('registeredUser', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      survey,
      invites
    });
  } catch (error) {
    console.error('Error fetching company survey:', error);
    res.status(500).json({ error: 'Failed to fetch company survey' });
  }
};

// Add invites to a company survey
const addInvites = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { invites } = req.body;

    if (!Array.isArray(invites) || invites.length === 0) {
      return res.status(400).json({ error: 'Invites array is required and must not be empty' });
    }

    // Validate invite format
    for (const invite of invites) {
      if (!invite.email || !invite.fullName) {
        return res.status(400).json({ error: 'Each invite must have email and fullName' });
      }
    }

    const survey = await CompanySurvey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ error: 'Company survey not found' });
    }

    const newInvites = [];
    const errors = [];

    for (const inviteData of invites) {
      try {
        // Check if invite already exists for this survey and email
        const existingInvite = await UserInvite.findOne({
          companySurvey: surveyId,
          email: inviteData.email.toLowerCase().trim()
        });

        if (existingInvite) {
          errors.push(`Invite already exists for ${inviteData.email}`);
          continue;
        }

        const invite = new UserInvite({
          companySurvey: surveyId,
          email: inviteData.email.toLowerCase().trim(),
          fullName: inviteData.fullName.trim(),
          companyName: survey.companyName,
          expiresAt: survey.expiresAt
        });

        await invite.save();
        newInvites.push(invite);
      } catch (error) {
        console.error(`Error creating invite for ${inviteData.email}:`, error);
        errors.push(`Failed to create invite for ${inviteData.email}`);
      }
    }

    // Update survey invite count
    survey.inviteCount = await UserInvite.countDocuments({ companySurvey: surveyId });
    await survey.save();

    res.json({
      success: true,
      message: `Created ${newInvites.length} invites`,
      invites: newInvites,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error adding invites:', error);
    res.status(500).json({ error: 'Failed to add invites' });
  }
};

// Get registration URLs for a survey
const getRegistrationUrls = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { baseUrl = 'http://localhost:3000' } = req.query;

    const invites = await UserInvite.find({ 
      companySurvey: surveyId,
      status: 'pending'
    }).select('email fullName token');

    const urls = invites.map(invite => ({
      email: invite.email,
      fullName: invite.fullName,
      token: invite.token,
      url: invite.getRegistrationUrl(baseUrl)
    }));

    res.json({
      success: true,
      urls
    });
  } catch (error) {
    console.error('Error getting registration URLs:', error);
    res.status(500).json({ error: 'Failed to get registration URLs' });
  }
};

// Update company survey status
const updateSurveyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const survey = await CompanySurvey.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!survey) {
      return res.status(404).json({ error: 'Company survey not found' });
    }

    res.json({
      success: true,
      survey
    });
  } catch (error) {
    console.error('Error updating survey status:', error);
    res.status(500).json({ error: 'Failed to update survey status' });
  }
};

// Validate invite token (for registration)
const validateInviteToken = async (req, res) => {
  try {
    const { token } = req.params;

    const invite = await UserInvite.findValidByToken(token);

    if (!invite) {
      return res.status(404).json({ 
        error: 'Invalid or expired invitation token',
        valid: false
      });
    }

    res.json({
      success: true,
      valid: true,
      invite: {
        email: invite.email,
        fullName: invite.fullName,
        companyName: invite.companyName,
        companySurvey: invite.companySurvey
      }
    });
  } catch (error) {
    console.error('Error validating invite token:', error);
    res.status(500).json({ error: 'Failed to validate invite token' });
  }
};

// Delete a company survey (and all its invites)
const deleteCompanySurvey = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete all invites for this survey
    await UserInvite.deleteMany({ companySurvey: id });

    // Delete the survey
    const survey = await CompanySurvey.findByIdAndDelete(id);

    if (!survey) {
      return res.status(404).json({ error: 'Company survey not found' });
    }

    res.json({
      success: true,
      message: 'Company survey and all invites deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting company survey:', error);
    res.status(500).json({ error: 'Failed to delete company survey' });
  }
};

module.exports = {
  createCompanySurvey,
  getCompanySurveys,
  getCompanySurvey,
  addInvites,
  getRegistrationUrls,
  updateSurveyStatus,
  validateInviteToken,
  deleteCompanySurvey
};