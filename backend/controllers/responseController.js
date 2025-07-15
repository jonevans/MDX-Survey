const Response = require('../models/Response');
const User = require('../models/User');
const Company = require('../models/Company');
const scoringService = require('../services/scoringService');
const surveyData = require('../config/surveyData');

/**
 * Controller for handling questionnaire responses
 */
const responseController = {
  /**
   * Start a new response session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async startResponse(req, res) {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user already has any response (completed or incomplete)
      const existingResponse = await Response.findOne({
        userId: user._id
      }).sort({ createdAt: -1 }); // Get the most recent
      
      if (existingResponse) {
        if (!existingResponse.isCompleted) {
          // User has an incomplete response - continue it
          return res.status(200).json({
            message: 'Continuing existing response',
            response: existingResponse
          });
        } else {
          // User has a completed response - allow editing by "reopening" it
          existingResponse.isCompleted = false; // Mark as editable
          existingResponse.completionDate = null; // Clear completion date
          await existingResponse.save();
          
          return res.status(200).json({
            message: 'Editing existing response',
            response: existingResponse,
            isEditing: true
          });
        }
      }
      
      // Create a new response (first time user)
      const newResponse = new Response({
        userId: user._id,
        companyName: user.companyName,
        startDate: new Date(),
        answers: [],
        sectionProgress: {
          culture: false,
          leadership: false,
          trainingLearning: false,
          budget: false,
          recruitment: false,
          projectManagement: false,
          technologySystems: false,
          data: false,
          reporting: false
        }
      });
      
      await newResponse.save();
      
      res.status(201).json({
        message: 'New response started',
        response: newResponse
      });
    } catch (error) {
      console.error('Error starting response:', error);
      res.status(500).json({ message: 'Unable to start assessment. Please try again.' });
    }
  },
  
  /**
   * Save partial response data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async savePartialResponse(req, res) {
    try {
      const { id } = req.params;
      const { answers, categoryFeedback, sectionProgress } = req.body;
      
      // Verify ownership
      const response = await Response.findOne({
        _id: id,
        userId: req.user.id
      });
      
      if (!response) {
        return res.status(404).json({ message: 'Response not found or unauthorized' });
      }
      
      if (response.isCompleted) {
        return res.status(400).json({ message: 'Cannot modify completed response' });
      }
      
      // Update answers
      if (answers && Object.keys(answers).length > 0) {
        // Format answers to match schema
        const formattedAnswers = Object.entries(answers).map(([questionId, score]) => {
          // Find question category
          const question = surveyData.questions.find(q => q.id === parseInt(questionId));
          const category = question ? question.category : 'unknown';
          
          return {
            questionId: parseInt(questionId),
            category,
            score: parseInt(score)
          };
        });
        
        // Replace existing answers or add new ones
        formattedAnswers.forEach(newAnswer => {
          const existingIndex = response.answers.findIndex(a => 
            a.questionId === newAnswer.questionId
          );
          
          if (existingIndex >= 0) {
            response.answers[existingIndex].score = newAnswer.score;
          } else {
            response.answers.push(newAnswer);
          }
        });
      }
      
      // Update qualitative feedback
      if (categoryFeedback) {
        Object.entries(categoryFeedback).forEach(([category, feedback]) => {
          if (!response.categoryFeedback) {
            response.categoryFeedback = {};
          }
          response.categoryFeedback[category] = {
            ...response.categoryFeedback[category],
            ...feedback
          };
        });
      }
      
      // Update section progress
      if (sectionProgress) {
        Object.keys(sectionProgress).forEach(section => {
          if (response.sectionProgress.hasOwnProperty(section)) {
            response.sectionProgress[section] = sectionProgress[section];
          }
        });
      }
      
      await response.save();
      res.json({ message: 'Progress saved successfully' });
      
    } catch (error) {
      console.error('Error saving response:', error);
      res.status(500).json({ message: 'Unable to save progress. Please try again.' });
    }
  },
  
  /**
   * Complete a response and generate scores
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async completeResponse(req, res) {
    try {
      const { id } = req.params;
      const { answers, categoryFeedback } = req.body;
      
      // Verify ownership
      const response = await Response.findOne({
        _id: id,
        userId: req.user.id
      });
      
      if (!response) {
        return res.status(404).json({ message: 'Response not found or unauthorized' });
      }
      
      if (response.isCompleted) {
        return res.status(400).json({ message: 'Response already completed' });
      }
      
      // Update with final answers if provided
      if (answers && answers.length > 0) {
        // Clear existing answers and add new ones
        response.answers = answers;
      }
      
      // Update final qualitative feedback
      if (categoryFeedback) {
        Object.entries(categoryFeedback).forEach(([category, feedback]) => {
          if (!response.categoryFeedback) {
            response.categoryFeedback = {};
          }
          response.categoryFeedback[category] = {
            ...response.categoryFeedback[category],
            ...feedback
          };
        });
      }
      
      // Calculate scores and generate insights
      const answerMap = {};
      response.answers.forEach(answer => {
        answerMap[answer.questionId] = answer.score;
      });
      
      const scores = scoringService.calculateScores(answerMap);
      const maturityLevel = scoringService.determineMaturityLevel(scores.totalScore);
      
      // Generate AI insights based on scores and qualitative feedback
      // Make this non-blocking to prevent form hanging
      let aiInsights = null;
      try {
        // Set a timeout for AI generation to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AI generation timeout')), 10000); // 10 second timeout
        });
        
        const aiPromise = scoringService.generateAIInsights({
          scores,
          qualitativeFeedback: response.categoryFeedback,
          maturityLevel
        });
        
        aiInsights = await Promise.race([aiPromise, timeoutPromise]);
      } catch (error) {
        console.log('AI insights generation failed or timed out, will generate later:', error.message);
        // Continue without AI insights - they can be generated later
        aiInsights = null;
      }
      
      // Format the scoring summary to match the schema
      response.scoringSummary = {
        totalScore: scores.totalWeightedScore,
        normalizedScore: scores.normalizedScore,
        maturityLevel: maturityLevel.name,
        categoryScores: Object.fromEntries(
          Object.entries(scores.categoryScores).map(([categoryId, data]) => [
            categoryId,
            data.averageScore
          ])
        ),
        strengthAreas: scores.strengthAreas,
        improvementAreas: scores.improvementAreas,
        aiInsights
      };
      
      response.isCompleted = true;
      response.completionDate = new Date();
      
      await response.save();
      
      // Update invite status to completed if user was invited
      const User = require('../models/User');
      const UserInvite = require('../models/UserInvite');
      
      const user = await User.findById(response.userId);
      if (user && user.invitedBy) {
        await UserInvite.findByIdAndUpdate(user.invitedBy, {
          status: 'completed',
          completedAt: new Date()
        });
        console.log(`Updated invite status to completed for user: ${user.email}`);
      }
      
      res.json({
        message: 'Assessment completed successfully',
        responseId: response._id
      });
      
    } catch (error) {
      console.error('Error completing response:', error);
      res.status(500).json({ message: 'Unable to complete assessment. Please try again.' });
    }
  },
  
  /**
   * Get all responses for the current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserResponses(req, res) {
    try {
      const responses = await Response.find({
        userId: req.user.id
      }).sort({ completionDate: -1, startDate: -1 });
      
      res.status(200).json(responses);
    } catch (error) {
      console.error('Error getting user responses:', error);
      res.status(500).json({ message: 'Unable to retrieve responses. Please try again.' });
    }
  },
  
  /**
   * Get a specific response by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getResponseById(req, res) {
    try {
      const { id } = req.params;
      
      const response = await Response.findOne({
        _id: id,
        userId: req.user.id
      });
      
      if (!response) {
        return res.status(404).json({ message: 'Response not found or unauthorized' });
      }
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error getting response:', error);
      res.status(500).json({ message: 'Unable to retrieve response. Please try again.' });
    }
  },
  
  /**
   * Get list of all companies (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCompanies(req, res) {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
      
      const companies = await Company.find().sort({ name: 1 });
      
      res.status(200).json(companies);
    } catch (error) {
      console.error('Error getting companies:', error);
      res.status(500).json({ message: 'Unable to retrieve companies. Please try again.' });
    }
  },
  
  /**
   * Get summary data for a specific company (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCompanySummary(req, res) {
    try {
      const { name } = req.params;
      
      // Check if user is admin or belongs to the company
      if (!req.user.isAdmin && req.user.companyName !== name) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
      
      const company = await Company.findOne({ name });
      
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      
      // Get response count
      const responseCount = await Response.countDocuments({
        companyName: name,
        isCompleted: true
      });
      
      // Get users from this company
      const userCount = await User.countDocuments({
        companyName: name
      });
      
      const summary = {
        company,
        responseCount,
        userCount,
        completionRate: userCount > 0 ? (responseCount / userCount) * 100 : 0
      };
      
      res.status(200).json(summary);
    } catch (error) {
      console.error('Error getting company summary:', error);
      res.status(500).json({ message: 'Unable to retrieve company summary. Please try again.' });
    }
  }
};

module.exports = responseController;
