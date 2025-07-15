import axios from 'axios';
import API_URL from '../config/api';

const generateInsights = async (assessmentData) => {
  if (!assessmentData || !assessmentData.maturityLevel || !assessmentData.scoringSummary) {
    return {
      summary: "Unable to generate insights due to invalid assessment data.",
      keyFindings: [],
      recommendations: [],
      nextSteps: []
    };
  }

  try {
    const response = await axios.post(`${API_URL}/api/ai/generate-insights`, {
      assessmentData
    }, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
        'Content-Type': 'application/json'
      }
    });

    if (!response.data || !response.data.insights) {
      throw new Error('Invalid response format from insights API');
    }

    return response.data.insights;
  } catch (error) {
    console.error('Error in generateInsights:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return {
      summary: "We're currently experiencing issues generating detailed insights. However, you can review your scores and maturity level above for a general assessment of your digital transformation status.",
      keyFindings: [],
      recommendations: [],
      nextSteps: []
    };
  }
};

export { generateInsights }; 