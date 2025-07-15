const User = require('../models/User');
const Response = require('../models/Response');
const Company = require('../models/Company');
const scoringService = require('../services/scoringService');

/**
 * Controller for admin-specific functionality
 */
const adminController = {
  /**
   * Get all companies
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllCompanies(req, res) {
    try {
      // Get all unique company names from responses (like in getDashboardStats)
      const responseCompanies = await Response.distinct('companyName', { isCompleted: true });
      
      // Get response counts and aggregated scores for each company (using latest response per user)
      const companiesWithStats = await Promise.all(
        responseCompanies.map(async (companyName) => {
          const userCount = await User.countDocuments({
            companyName: companyName,
            isAdmin: { $ne: true }
          });
          
          // Get latest completed response per user for this company
          const uniqueCompletedResponses = await Response.aggregate([
            { $match: { 
                companyName: companyName, 
                isCompleted: true,
                'scoringSummary.totalScore': { $exists: true }
              }
            },
            { $sort: { userId: 1, completionDate: -1 } },
            { $group: { _id: '$userId', latestResponse: { $first: '$$ROOT' } } },
            { $replaceRoot: { newRoot: '$latestResponse' } }
          ]);
          
          // Calculate average DX maturity score from unique responses
          let averageTotal = 0;
          if (uniqueCompletedResponses.length > 0) {
            const totalScore = uniqueCompletedResponses.reduce((sum, response) => 
              sum + (response.scoringSummary?.totalScore || 0), 0);
            averageTotal = Math.round((totalScore / uniqueCompletedResponses.length) * 100) / 100;
          }
          
          const responseCount = uniqueCompletedResponses.length;
          
          return {
            name: companyName,
            responseCount,
            userCount,
            completionRate: userCount > 0 ? (responseCount / userCount) * 100 : 0,
            aggregatedScores: {
              averageTotal
            }
          };
        })
      );
      
      // Sort companies by average score (descending)
      companiesWithStats.sort((a, b) => 
        (b.aggregatedScores?.averageTotal || 0) - (a.aggregatedScores?.averageTotal || 0)
      );
      
      res.status(200).json(companiesWithStats);
    } catch (error) {
      console.error('Error getting companies:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  
  /**
   * Get company details including all responses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCompanyDetails(req, res) {
    try {
      const { name } = req.params;
      
      const company = await Company.findOne({ name });
      
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      
      // Get all completed responses for this company
      const responses = await Response.find({
        companyName: name,
        isCompleted: true
      }).sort({ completionDate: -1 });
      
      // Get all users from this company
      const users = await User.find({
        companyName: name
      }).select('-password');
      
      // Calculate average scores
      const averageScores = company.aggregatedScores || {};
      
      res.status(200).json({
        company,
        responses,
        users,
        averageScores,
        responseCount: responses.length,
        userCount: users.length,
        completionRate: users.length > 0 ? (responses.length / users.length) * 100 : 0
      });
    } catch (error) {
      console.error('Error getting company details:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  
  /**
   * Get all responses across all companies
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllResponses(req, res) {
    try {
      // Get all completed responses
      const responses = await Response.find({
        isCompleted: true
      }).sort({ completionDate: -1 });
      
      // Add user and company information to each response
      const responsesWithDetails = await Promise.all(
        responses.map(async (response) => {
          const user = await User.findById(response.userId).select('-password');
          
          return {
            ...response.toObject(),
            userDetails: user ? {
              fullName: user.fullName,
              email: user.email,
              department: user.department,
              jobTitle: user.jobTitle
            } : null
          };
        })
      );
      
      res.status(200).json(responsesWithDetails);
    } catch (error) {
      console.error('Error getting all responses:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  
  /**
   * Get detailed response data including all answers and feedback
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getResponseDetails(req, res) {
    try {
      const { id } = req.params;
      
      const response = await Response.findById(id);
      
      if (!response) {
        return res.status(404).json({ message: 'Response not found' });
      }
      
      if (!response.isCompleted) {
        return res.status(400).json({ message: 'Response is not yet completed' });
      }
      
      // Get user details
      const user = await User.findById(response.userId).select('-password');
      
      // Generate or retrieve report
      const report = await scoringService.generateReport(id);
      
      res.status(200).json({
        response,
        report,
        userDetails: user ? {
          fullName: user.fullName,
          email: user.email,
          department: user.department,
          jobTitle: user.jobTitle
        } : null
      });
    } catch (error) {
      console.error('Error getting response details:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  
  /**
   * Get summary statistics for admin dashboard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDashboardStats(req, res) {
    try {
      // Get basic stats (exclude admin users)
      const totalCompanies = await Company.countDocuments();
      const totalUsers = await User.countDocuments({ isAdmin: { $ne: true } });
      
      // Get unique users who have completed responses (latest response per user, exclude admins)
      const usersWithCompletedResponses = await Response.aggregate([
        // First lookup user info to filter out admins
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $match: { 'user.isAdmin': { $ne: true } } }, // Exclude admin users
        { $sort: { userId: 1, createdAt: -1 } }, // Sort by user and creation date (latest first)
        { $group: { _id: '$userId', latestResponse: { $first: '$$ROOT' } } }, // Get latest response per user
        { $match: { 'latestResponse.isCompleted': true } }, // Only count completed responses
        { $count: 'total' }
      ]);
      
      const totalCompletedUsers = usersWithCompletedResponses.length > 0 ? usersWithCompletedResponses[0].total : 0;
      
      // Get total unique responses (one per user - their latest, exclude admins)
      const totalUniqueResponses = await Response.aggregate([
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $match: { 'user.isAdmin': { $ne: true } } }, // Exclude admin users
        { $sort: { userId: 1, createdAt: -1 } },
        { $group: { _id: '$userId', latestResponse: { $first: '$$ROOT' } } },
        { $count: 'total' }
      ]);
      
      const totalResponses = totalUniqueResponses.length > 0 ? totalUniqueResponses[0].total : 0;
      
      // Calculate completion rate (users with completed assessments / total users)
      const completionRate = totalUsers > 0 
        ? (totalCompletedUsers / totalUsers) * 100 
        : 0;
      
      // Get recent responses (latest per user) with user details (exclude admins)
      const recentResponsesData = await Response.aggregate([
        { $match: { isCompleted: true } },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $match: { 'user.isAdmin': { $ne: true } } }, // Exclude admin users
        { $sort: { userId: 1, completionDate: -1 } },
        { $group: { _id: '$userId', latestResponse: { $first: '$$ROOT' } } },
        { $sort: { 'latestResponse.completionDate': -1 } },
        { $limit: 5 },
        { $replaceRoot: { newRoot: '$latestResponse' } }
      ]);
      
      const recentResponsesWithDetails = await Promise.all(
        recentResponsesData.map(async (response) => {
          const user = await User.findById(response.userId).select('-password');
          return {
            ...response,
            userDetails: user
          };
        })
      );
      
      // Get top companies by DX Maturity score (using latest response per user)
      // First get all unique company names from responses
      const responseCompanies = await Response.distinct('companyName', { isCompleted: true });
      
      const topCompaniesData = await Promise.all(
        responseCompanies.map(async (companyName) => {
          const userCount = await User.countDocuments({
            companyName: companyName,
            isAdmin: { $ne: true }
          });
          
          // Get latest completed response per user for this company
          const uniqueCompletedResponses = await Response.aggregate([
            { $match: { 
                companyName: companyName, 
                isCompleted: true,
                'scoringSummary.totalScore': { $exists: true }
              }
            },
            { $sort: { userId: 1, completionDate: -1 } },
            { $group: { _id: '$userId', latestResponse: { $first: '$$ROOT' } } },
            { $replaceRoot: { newRoot: '$latestResponse' } }
          ]);
          
          // Calculate average DX maturity score from unique responses
          let averageTotal = 0;
          if (uniqueCompletedResponses.length > 0) {
            const totalScore = uniqueCompletedResponses.reduce((sum, response) => 
              sum + (response.scoringSummary?.totalScore || 0), 0);
            averageTotal = Math.round((totalScore / uniqueCompletedResponses.length) * 100) / 100;
          }
          
          return {
            name: companyName,
            responseCount: uniqueCompletedResponses.length, // Count of unique completed responses
            userCount,
            aggregatedScores: {
              averageTotal
            }
          };
        })
      );
      
      // Sort companies by average score and get top 10
      const topCompanies = topCompaniesData
        .sort((a, b) => (b.aggregatedScores?.averageTotal || 0) - (a.aggregatedScores?.averageTotal || 0))
        .slice(0, 10);
      
      res.status(200).json({
        stats: {
          totalCompanies,
          totalUsers,
          totalResponses: totalCompletedUsers, // Show completed assessments count
          completionRate
        },
        recentResponses: recentResponsesWithDetails,
        topCompanies
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  
  /**
   * Delete a response
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteResponse(req, res) {
    try {
      const { id } = req.params;
      
      const response = await Response.findById(id);
      
      if (!response) {
        return res.status(404).json({ message: 'Response not found' });
      }
      
      await Response.findByIdAndDelete(id);
      
      res.status(200).json({ message: 'Response deleted successfully' });
    } catch (error) {
      console.error('Error deleting response:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = adminController; 