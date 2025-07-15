const Response = require('../models/Response');
const scoringService = require('../services/scoringService');
const surveyData = require('../config/surveyData');
const Company = require('../models/Company');

/**
 * Controller for generating and retrieving reports
 */
const reportController = {
  /**
   * Get a full report for a completed response
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getReport(req, res) {
    try {
      const { responseId } = req.params;
      
      // Find response and verify ownership
      const response = await Response.findOne({
        _id: responseId,
        userId: req.user.id
      });
      
      if (!response) {
        return res.status(404).json({ message: 'Response not found or unauthorized' });
      }
      
      if (!response.isCompleted) {
        return res.status(400).json({ message: 'Response is not yet completed' });
      }
      
      // Generate or retrieve report
      let report;
      
      if (
        response.scoringSummary && 
        response.scoringSummary.totalScore && 
        response.scoringSummary.maturityLevel
      ) {
        // Report data already exists, retrieve it
        const answerMap = {};
        response.answers.forEach(answer => {
          answerMap[answer.questionId] = answer.score;
        });
        
        // Calculate scores to get normalized score
        const scores = scoringService.calculateScores(answerMap);
        
        // Get improvement suggestions
        const improvementSuggestions = scoringService.getImprovementSuggestions(
          response.scoringSummary.improvementAreas || [],
          answerMap
        );
        
        // Fetch maturity level details
        const maturityLevel = scoringService.determineMaturityLevel(response.scoringSummary.totalScore);
        
        report = {
          responseId: response._id,
          userId: response.userId,
          companyName: response.companyName,
          completionDate: response.completionDate,
          scoringSummary: {
            ...response.scoringSummary,
            normalizedScore: scores.normalizedScore
          },
          maturityLevel,
          improvementSuggestions,
          categoryFeedback: response.categoryFeedback || {},
          // Include AI insights if they exist
          aiInsights: response.scoringSummary?.aiInsights || null
        };
      } else {
        // Generate new report
        report = await scoringService.generateReport(responseId);
      }
      
      // Add category descriptions to the report
      report.categoryDetails = surveyData.categories.reduce((acc, category) => {
        acc[category.id] = {
          name: category.name,
          description: category.description
        };
        return acc;
      }, {});
      
      // Add company response count
      const company = await Company.findOne({ name: response.companyName });
      if (company) {
        report.companyResponseCount = company.responseCount;
      }
      
      res.status(200).json(report);
    } catch (error) {
      console.error('Error getting report:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  
  /**
   * Get company comparison data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCompanyComparison(req, res) {
    try {
      const { responseId } = req.params;
      
      // Find response and verify ownership
      const response = await Response.findOne({
        _id: responseId,
        userId: req.user.id
      });
      
      if (!response) {
        return res.status(404).json({ message: 'Response not found or unauthorized' });
      }
      
      if (!response.isCompleted) {
        return res.status(400).json({ message: 'Response is not yet completed' });
      }
      
      // Get comparison data
      const comparison = await scoringService.getCompanyComparison(responseId);
      
      if (!comparison) {
        return res.status(404).json({ message: 'Not enough data for company comparison' });
      }
      
      // Add category information
      comparison.categoryDetails = surveyData.categories.reduce((acc, category) => {
        if (comparison.categoryComparisons[category.id]) {
          acc[category.id] = {
            name: category.name,
            description: category.description
          };
        }
        return acc;
      }, {});
      
      res.status(200).json(comparison);
    } catch (error) {
      console.error('Error getting company comparison:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = reportController;
