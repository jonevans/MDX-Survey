const Response = require('../models/Response');
const Company = require('../models/Company');
const surveyData = require('../config/surveyData');

/**
 * Service for calculating scores and generating reports based on responses
 */
class ScoringService {
  /**
   * Calculate weighted scores for a single response
   * @param {Object} answers - Object containing question IDs as keys and answer values as values
   * @returns {Object} Object containing calculated scores and maturity level
   */
  calculateScores(answers) {
    // Initialize category scores
    const categoryScores = {};
    surveyData.categories.forEach(category => {
      categoryScores[category.id] = {
        totalWeightedScore: 0,
        maxPossibleScore: 0,
        questionCount: 0,
        averageScore: 0
      };
    });
    
    // Calculate weighted scores for each answer
    const scoredAnswers = [];
    let totalWeightedScore = 0;
    let maxPossibleScore = 0;
    
    // Process each answer
    Object.entries(answers).forEach(([questionId, score]) => {
      // Find the question in the survey data
      const question = surveyData.questions.find(q => q.id === parseInt(questionId));
      
      if (question) {
        const weightFactor = question.weightFactor || 1;
        const weightedScore = score * weightFactor;
        
        // Add to total score
        totalWeightedScore += weightedScore;
        maxPossibleScore += 5 * weightFactor; // 5 is max possible score per question
        
        // Add to category score
        categoryScores[question.category].totalWeightedScore += weightedScore;
        categoryScores[question.category].maxPossibleScore += 5 * weightFactor;
        categoryScores[question.category].questionCount += 1;
        
        // Save scored answer
        scoredAnswers.push({
          questionId: parseInt(questionId),
          category: question.category,
          score,
          weightedScore
        });
      }
    });
    
    // Calculate category average scores
    Object.keys(categoryScores).forEach(categoryId => {
      const category = categoryScores[categoryId];
      if (category.questionCount > 0) {
        category.averageScore = 
          (category.totalWeightedScore / category.maxPossibleScore) * 5; // Convert to 0-5 scale
      }
    });
    
    // Normalize total weighted score to 135 maximum
    const normalizedTotalScore = (totalWeightedScore / maxPossibleScore) * 135;
    
    // Determine maturity level using the normalized score
    const maturityLevel = this.determineMaturityLevel(normalizedTotalScore);
    
    // Identify strengths and improvement areas
    const categoryScoresArray = Object.entries(categoryScores)
      .filter(([_, data]) => data.questionCount > 0)
      .map(([categoryId, data]) => ({
        categoryId,
        averageScore: data.averageScore
      }))
      .sort((a, b) => b.averageScore - a.averageScore);
    
    const strengthAreas = categoryScoresArray
      .slice(0, 3)
      .filter(item => item.averageScore >= 3.5)
      .map(item => item.categoryId);
    
    const improvementAreas = categoryScoresArray
      .slice(-3)
      .filter(item => item.averageScore < 3.5)
      .map(item => item.categoryId);
    
    return {
      totalWeightedScore: normalizedTotalScore, // Return the normalized score
      maxPossibleScore: 135, // Set to fixed maximum
      normalizedScore: (normalizedTotalScore / 135) * 100, // As a percentage
      maturityLevel,
      categoryScores,
      scoredAnswers,
      strengthAreas,
      improvementAreas
    };
  }
  
  /**
   * Determine the maturity level based on the total weighted score
   * @param {Number} totalWeightedScore - The total weighted score
   * @returns {Object} Maturity level details
   */
  determineMaturityLevel(totalWeightedScore) {
    const { maturityLevels } = surveyData.scoring;
    
    // If score is above the highest range, return the highest level
    if (totalWeightedScore > maturityLevels[maturityLevels.length - 1].range[1]) {
      const highestLevel = maturityLevels[maturityLevels.length - 1];
      return {
        name: highestLevel.level,
        description: highestLevel.description,
        score: totalWeightedScore,
        range: highestLevel.range
      };
    }
    
    // Find matching level
    for (const level of maturityLevels) {
      if (
        totalWeightedScore >= level.range[0] && 
        totalWeightedScore <= level.range[1]
      ) {
        return {
          name: level.level,
          description: level.description,
          score: totalWeightedScore,
          range: level.range
        };
      }
    }
    
    // Default to lowest level if below minimum (shouldn't happen with positive scores)
    return {
      name: maturityLevels[0].level,
      description: maturityLevels[0].description,
      score: totalWeightedScore,
      range: maturityLevels[0].range
    };
  }
  
  /**
   * Get improvement suggestions for low-scoring categories
   * @param {Array} improvementAreas - Array of category IDs that need improvement
   * @param {Object} answers - The user's answers
   * @returns {Object} Improvement suggestions by category
   */
  getImprovementSuggestions(improvementAreas, answers) {
    const suggestions = {};
    
    improvementAreas.forEach(categoryId => {
      const categoryQuestions = surveyData.questions.filter(q => q.category === categoryId);
      const categorySuggestions = [];
      
      // Find low-scoring questions in this category
      categoryQuestions.forEach(question => {
        const score = answers[question.id];
        
        // If score is low (0, 1, or 2), add the improvement suggestion
        if (score !== undefined && score <= 2) {
          categorySuggestions.push({
            questionId: question.id,
            text: question.text,
            score,
            suggestion: question.improvementSuggestion
          });
        }
      });
      
      suggestions[categoryId] = categorySuggestions;
    });
    
    return suggestions;
  }
  
  /**
   * Generate a full report based on a completed response
   * @param {String} responseId - The ID of the response
   * @returns {Object} Complete report with scores and suggestions
   */
  async generateReport(responseId) {
    try {
      const response = await Response.findById(responseId);
      
      if (!response || !response.isCompleted) {
        throw new Error('Response not found or not completed');
      }
      
      // Extract answers into the format expected by calculateScores
      const answers = {};
      response.answers.forEach(answer => {
        answers[answer.questionId] = answer.score;
      });
      
      // Calculate scores
      const scoringResults = this.calculateScores(answers);
      
      // Get improvement suggestions
      const improvementSuggestions = this.getImprovementSuggestions(
        scoringResults.improvementAreas, 
        answers
      );
      
      // Update response with scoring information
      response.scoringSummary = {
        totalScore: scoringResults.totalWeightedScore,
        maturityLevel: scoringResults.maturityLevel.name,
        categoryScores: Object.fromEntries(
          Object.entries(scoringResults.categoryScores).map(([categoryId, data]) => [
            categoryId, 
            data.averageScore
          ])
        ),
        strengthAreas: scoringResults.strengthAreas,
        improvementAreas: scoringResults.improvementAreas
      };
      
      await response.save();
      
      // Update company aggregated data
      await this.updateCompanyScores(response.companyName);
      
      return {
        responseId: response._id,
        userId: response.userId,
        companyName: response.companyName,
        completionDate: response.completionDate,
        scoringSummary: response.scoringSummary,
        maturityLevel: scoringResults.maturityLevel,
        categoryScores: scoringResults.categoryScores,
        improvementSuggestions,
        categoryFeedback: response.categoryFeedback || {}
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }
  
  /**
   * Update aggregated scores for a company
   * @param {String} companyName - The name of the company
   */
  async updateCompanyScores(companyName) {
    try {
      // Find all completed responses for this company
      const responses = await Response.find({
        companyName,
        isCompleted: true
      });
      
      if (responses.length === 0) {
        return;
      }
      
      // Calculate average scores across all responses
      const categoryTotals = {};
      let totalScoreSum = 0;
      
      // Initialize category totals
      surveyData.categories.forEach(category => {
        categoryTotals[category.id] = {
          sum: 0,
          count: 0
        };
      });
      
      // Sum up scores from all responses
      responses.forEach(response => {
        if (response.scoringSummary && response.scoringSummary.totalScore) {
          totalScoreSum += response.scoringSummary.totalScore;
          
          // Sum category scores
          Object.entries(response.scoringSummary.categoryScores || {}).forEach(([categoryId, score]) => {
            if (!categoryTotals[categoryId]) {
              categoryTotals[categoryId] = { sum: 0, count: 0 };
            }
            
            categoryTotals[categoryId].sum += score;
            categoryTotals[categoryId].count += 1;
          });
        }
      });
      
      // Calculate averages
      const averageTotal = totalScoreSum / responses.length;
      const categoriesAverage = {};
      
      Object.entries(categoryTotals).forEach(([categoryId, data]) => {
        if (data.count > 0) {
          categoriesAverage[categoryId] = data.sum / data.count;
        } else {
          categoriesAverage[categoryId] = 0;
        }
      });
      
      // Determine company maturity level
      const maturityLevel = this.determineMaturityLevel(averageTotal).name;
      
      // Find strength and improvement areas
      const sortedCategories = Object.entries(categoriesAverage)
        .map(([categoryId, score]) => ({ categoryId, score }))
        .sort((a, b) => b.score - a.score);
      
      const strengthAreas = sortedCategories
        .slice(0, 3)
        .filter(item => item.score >= 3.5)
        .map(item => item.categoryId);
      
      const improvementAreas = sortedCategories
        .slice(-3)
        .filter(item => item.score < 3.5)
        .map(item => item.categoryId);
      
      // Update or create company record
      await Company.findOneAndUpdate(
        { name: companyName },
        {
          name: companyName,
          responseCount: responses.length,
          aggregatedScores: {
            averageTotal,
            companyMaturityLevel: maturityLevel,
            categoriesAverage
          },
          strengthAreas,
          improvementAreas
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error updating company scores:', error);
      throw error;
    }
  }
  
  /**
   * Compare an individual's results with their company's average
   * @param {String} responseId - The ID of the individual response
   * @returns {Object} Comparison data between individual and company
   */
  async getCompanyComparison(responseId) {
    try {
      const response = await Response.findById(responseId);
      
      if (!response || !response.isCompleted) {
        throw new Error('Response not found or not completed');
      }
      
      const company = await Company.findOne({ name: response.companyName });
      
      if (!company || company.responseCount <= 1) {
        return null; // Not enough data for comparison
      }
      
      // Compare individual scores with company averages
      const comparison = {
        maturityLevel: {
          individual: response.scoringSummary.maturityLevel,
          company: company.aggregatedScores.companyMaturityLevel
        },
        totalScore: {
          individual: response.scoringSummary.totalScore,
          company: company.aggregatedScores.averageTotal,
          difference: response.scoringSummary.totalScore - company.aggregatedScores.averageTotal
        },
        categoryComparisons: {}
      };
      
      // Compare category scores
      Object.entries(response.scoringSummary.categoryScores || {}).forEach(([categoryId, score]) => {
        const companyScore = company.aggregatedScores.categoriesAverage[categoryId] || 0;
        
        comparison.categoryComparisons[categoryId] = {
          individual: score,
          company: companyScore,
          difference: score - companyScore
        };
      });
      
      return comparison;
    } catch (error) {
      console.error('Error getting company comparison:', error);
      throw error;
    }
  }
  
  /**
   * Generate AI insights based on scores and qualitative feedback
   * @param {Object} data - Object containing scores, feedback, and maturity level
   * @returns {Object} AI-generated insights
   */
  async generateAIInsights(data) {
    const { scores, qualitativeFeedback, maturityLevel } = data;
    
    try {
      // Use the AI controller to generate insights
      const OpenAI = require('openai');
      
      if (!process.env.OPENAI_API_KEY) {
        console.log('OpenAI API key not configured, using mock insights');
        return this._generateMockInsights(scores, qualitativeFeedback, maturityLevel);
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const prompt = `
        As a digital transformation expert, analyze this assessment data and provide insights:
        
        Maturity Level: ${maturityLevel.name} (Score: ${scores.totalWeightedScore}/135)
        
        Category Scores and Feedback:
        ${Object.entries(scores.categoryScores || {})
          .map(([category, data]) => {
            const feedback = qualitativeFeedback?.[category] || {};
            return `
        ${category} (Score: ${data.averageScore?.toFixed(1) || 0}/5)
        Strengths: ${feedback.strengths || 'No specific strengths provided'}
        Challenges: ${feedback.challenges || 'No specific challenges provided'}`
          })
          .join('\n')}
        
        ### Analysis Scope:
        1. **Overall Maturity Context**: 
           - Provide a brief summary of the organization's digital transformation stage
           - Consider both quantitative scores and qualitative feedback in your assessment
           - Analyze how their total score compares to typical benchmarks
           - Highlight any discrepancies between scores and qualitative feedback

        2. **Key Findings**:
           - Identify strengths and highlight how these capabilities positively impact other areas
           - Use specific examples from the qualitative feedback to support your findings
           - Identify weaknesses, analyzing whether they create roadblocks in other categories
           - Note any patterns or themes that emerge from the qualitative feedback
           - Assess how different category scores interact—where do strengths compensate for weaknesses

        3. **Strategic Recommendations**:
           - Provide tailored recommendations based on both scores and qualitative feedback
           - Address specific challenges mentioned in the feedback
           - Focus on areas where targeted improvements will have the greatest cascading effect
           - Consider the organization's current strengths when suggesting improvements

        4. **Next Steps**:
           - Provide 3-5 specific, actionable steps the organization should take in the next 30-90 days
           - Each step should be clear, measurable, and directly tied to improving specific aspects
           - Steps should be prioritized by impact and feasibility
           - Each step should include a clear outcome or success metric
           - Consider the specific challenges and context provided in the qualitative feedback
        
        Format the response as a JSON object with these keys:
        {
          "summary": "A single string summarizing the overall analysis",
          "keyFindings": ["Array of strings, each containing a complete finding"],
          "recommendations": ["Array of strings, each containing a complete recommendation"],
          "actionItems": ["Array of 3-5 strings, each containing a specific, actionable step with timeline and success metric"]
        }

        IMPORTANT: Each array must contain only strings, not objects. Each string should be a complete, self-contained insight.
      `;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a digital transformation expert providing insights based on assessment data. Always return arrays of strings, never objects or nested structures.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      if (!completion.choices || !completion.choices[0]?.message?.content) {
        throw new Error('Invalid response format from OpenAI API');
      }

      const insights = JSON.parse(completion.choices[0].message.content);
      
      // Validate response format
      if (typeof insights.summary !== 'string' ||
          !Array.isArray(insights.keyFindings) ||
          !Array.isArray(insights.recommendations) ||
          !Array.isArray(insights.actionItems) ||
          !insights.keyFindings.every(item => typeof item === 'string') ||
          !insights.recommendations.every(item => typeof item === 'string') ||
          !insights.actionItems.every(item => typeof item === 'string')) {
        throw new Error('Invalid response structure from OpenAI API');
      }

      console.log('AI insights generated successfully');
      return insights;
      
    } catch (error) {
      console.error('Error generating AI insights:', error);
      console.log('Falling back to mock insights');
      return this._generateMockInsights(scores, qualitativeFeedback, maturityLevel);
    }
  }

  /**
   * Generate mock insights when AI is unavailable
   * @private
   */
  _generateMockInsights(scores, qualitativeFeedback, maturityLevel) {
    return {
      summary: `Based on the assessment, the organization is at a ${maturityLevel.name} maturity level with a score of ${scores.totalWeightedScore}. Key strengths are identified in ${this._getTopCategories(scores.categoryScores)} while opportunities for improvement exist in ${this._getBottomCategories(scores.categoryScores)}.`,
      keyFindings: this._generateKeyFindings(scores, qualitativeFeedback),
      recommendations: this._generateRecommendations(scores, qualitativeFeedback),
      actionItems: this._generateActionItems(scores, qualitativeFeedback)
    };
  }
  
  /**
   * Helper method to get top performing categories
   * @private
   */
  _getTopCategories(categoryScores) {
    const sortedCategories = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b.averageScore - a.averageScore)
      .slice(0, 3)
      .map(([category]) => category);
    return sortedCategories.join(', ');
  }
  
  /**
   * Helper method to get categories needing most improvement
   * @private
   */
  _getBottomCategories(categoryScores) {
    const sortedCategories = Object.entries(categoryScores)
      .sort(([, a], [, b]) => a.averageScore - b.averageScore)
      .slice(0, 3)
      .map(([category]) => category);
    return sortedCategories.join(', ');
  }
  
  /**
   * Generate key findings based on scores and feedback
   * @private
   */
  _generateKeyFindings(scores, feedback) {
    const findings = [];
    
    // Add findings based on scores
    Object.entries(scores.categoryScores).forEach(([category, data]) => {
      if (data.averageScore >= 4) {
        findings.push(`Strong performance in ${category} with an average score of ${data.averageScore.toFixed(1)}`);
      } else if (data.averageScore <= 2) {
        findings.push(`Significant opportunity for improvement in ${category} with an average score of ${data.averageScore.toFixed(1)}`);
      }
    });
    
    // Add findings based on qualitative feedback
    Object.entries(feedback || {}).forEach(([category, categoryFeedback]) => {
      if (categoryFeedback.strengths) {
        findings.push(`${category}: ${categoryFeedback.strengths.substring(0, 100)}...`);
      }
      if (categoryFeedback.challenges) {
        findings.push(`${category} challenges: ${categoryFeedback.challenges.substring(0, 100)}...`);
      }
    });
    
    return findings;
  }
  
  /**
   * Generate recommendations based on scores and feedback
   * @private
   */
  _generateRecommendations(scores, feedback) {
    const recommendations = [];
    
    // Get improvement suggestions for low-scoring categories
    Object.entries(scores.categoryScores).forEach(([category, data]) => {
      if (data.averageScore <= 3) {
        const categoryInfo = surveyData.categories.find(c => c.id === category);
        if (categoryInfo) {
          recommendations.push(
            `Strengthen ${categoryInfo.name.toLowerCase()} capabilities through targeted initiatives and training programs`
          );
        }
      }
    });
    
    // Add recommendations based on qualitative feedback
    Object.entries(feedback || {}).forEach(([category, categoryFeedback]) => {
      if (categoryFeedback.challenges) {
        recommendations.push(
          `Address ${category} challenges by: ${categoryFeedback.challenges.substring(0, 100)}...`
        );
      }
    });
    
    return recommendations;
  }
  
  /**
   * Generate specific action items based on scores and feedback
   * @private
   */
  _generateActionItems(scores, feedback) {
    const actionItems = [];
    
    // Generate quick wins for high-impact areas
    Object.entries(scores.categoryScores).forEach(([category, data]) => {
      if (data.averageScore <= 2) {
        const questions = surveyData.questions.filter(q => q.category === category);
        questions.forEach(question => {
          if (question.improvementSuggestion) {
            actionItems.push(question.improvementSuggestion);
          }
        });
      }
    });
    
    return actionItems;
  }
}

module.exports = new ScoringService();
