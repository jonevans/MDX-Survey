import axios from 'axios';

const generateInsights = async (assessmentData) => {
  if (!assessmentData || !assessmentData.maturityLevel || !assessmentData.scoringSummary) {
    console.error('Invalid assessment data:', assessmentData);
    return {
      summary: "Unable to generate insights due to invalid assessment data.",
      keyFindings: [],
      recommendations: [],
      nextSteps: []
    };
  }

  try {
    const response = await axios.post('/api/ai/generate-insights', {
      assessmentData
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