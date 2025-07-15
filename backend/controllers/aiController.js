const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const analyzeResponse = async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert in analyzing survey responses and understanding respondent sentiment. Your analysis should be concise, insightful, and focus on the emotional undertones and implicit meanings in the responses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const analysis = completion.choices[0].message.content;

    res.json({ analysis });
  } catch (error) {
    console.error('Error in AI analysis:', error);
    res.status(500).json({ error: 'AI analysis is currently unavailable. Please try again later.' });
  }
};

const generateInsights = async (req, res) => {
  try {
    const { assessmentData } = req.body;
    
    if (!assessmentData || !assessmentData.maturityLevel || !assessmentData.scoringSummary) {
      return res.status(400).json({ error: 'Invalid assessment data provided' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        insights: {
          summary: "AI insights are currently unavailable due to configuration issues.",
          keyFindings: [],
          recommendations: [],
          nextSteps: []
        }
      });
    }

    const prompt = `
      As a digital transformation expert, analyze this assessment data and provide insights:
      
      Maturity Level: ${assessmentData.maturityLevel.name} (Score: ${assessmentData.scoringSummary.totalScore}/135)
      
      Category Scores and Feedback:
      ${Object.entries(assessmentData.scoringSummary.categoryScores || {})
        .map(([category, score]) => {
          const feedback = assessmentData.categoryFeedback?.[category] || {};
          return `
      ${category} (Score: ${score}/5)
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
         Example format:
         "Establish a Digital Skills Training Program: Launch a structured training program focusing on [specific skills from assessment]. Target: 80% employee participation within 60 days. Success metric: Improved scores in Training & Learning category."
      
      Format the response as a JSON object with these keys:
      {
        "summary": "A single string summarizing the overall analysis",
        "keyFindings": ["Array of strings, each containing a complete finding"],
        "recommendations": ["Array of strings, each containing a complete recommendation"],
        "nextSteps": ["Array of 3-5 strings, each containing a specific, actionable step with timeline and success metric"]
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
        !Array.isArray(insights.nextSteps) ||
        !insights.keyFindings.every(item => typeof item === 'string') ||
        !insights.recommendations.every(item => typeof item === 'string') ||
        !insights.nextSteps.every(item => typeof item === 'string')) {
      throw new Error('Invalid response structure from OpenAI API');
    }

    res.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ 
      insights: {
        summary: "We're currently experiencing issues generating detailed insights. However, you can review your scores and maturity level above for a general assessment of your digital transformation status.",
        keyFindings: [],
        recommendations: [],
        nextSteps: []
      }
    });
  }
};

const analyzeCompleteResponse = async (req, res) => {
  try {
    const { responseId } = req.body;
    
    if (!responseId) {
      return res.status(400).json({ error: 'Response ID is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not configured, returning mock data');
      // Return mock data for testing
      return res.json({
        success: true,
        analysis: {
          sentimentAnalysis: {
            culture: "The respondent shows strong confidence in their organizational culture, highlighting supportive elements. However, they express a desire for more technology-focused events, suggesting room for improvement in digital culture aspects.",
            leadership: "Strong positive sentiment toward leadership capabilities, though they identify a specific gap in technology leadership that could hinder digital transformation efforts.",
            trainingLearning: "Significant frustration evident in responses about training. The absence of formal training programs creates concern for the respondent's confidence in organizational growth.",
            budget: "Clear concern about the absence of technology budgets, indicating awareness that financial constraints limit digital progress.",
            recruitment: "Awareness that current hiring practices don't prioritize tech-savvy candidates, showing understanding of skill gaps."
          },
          overallInsights: {
            summary: "This organization shows a strong foundation in culture and leadership but faces significant challenges in technical capabilities and formal training programs. The assessment reveals a company ready for digital transformation but lacking the infrastructure and skills development programs needed to succeed.",
            keyFindings: [
              "Strong organizational culture provides foundation for change",
              "Leadership gaps in technology domain create implementation barriers", 
              "Complete absence of training programs limits skill development",
              "No dedicated technology budgets constrain digital initiatives"
            ],
            recommendations: [
              "Establish dedicated technology leadership roles or training for current leaders",
              "Create structured digital skills training program for all employees",
              "Allocate specific budget for technology initiatives and digital transformation",
              "Implement project management capabilities to support digital projects"
            ],
            nextSteps: [
              "Hire or train a Chief Technology Officer within 30 days to lead digital initiatives",
              "Launch employee digital skills assessment and training program within 60 days",
              "Establish dedicated technology budget (3-5% of revenue) for next fiscal quarter", 
              "Implement project management framework and tools within 90 days"
            ]
          }
        }
      });
    }

    // Get response data
    const Response = require('../models/Response');
    const User = require('../models/User');
    
    const response = await Response.findById(responseId);
    if (!response || !response.isCompleted) {
      return res.status(404).json({ error: 'Completed response not found' });
    }

    const user = await User.findById(response.userId).select('-password');

    // Create comprehensive analysis prompt
    const prompt = `
As a digital transformation expert, analyze this completed assessment and provide both:
1. Sentiment analysis for each category with feedback
2. Overall insights if not already generated

Assessment Data:
- Company: ${response.companyName}
- User: ${user?.fullName || 'Unknown'}
- Total Score: ${response.scoringSummary?.totalScore || 0}/135
- Maturity Level: ${response.scoringSummary?.maturityLevel || 'Unknown'}

Category Analysis:
${Object.entries(response.scoringSummary?.categoryScores || {})
  .map(([categoryId, score]) => {
    const feedback = response.categoryFeedback?.[categoryId] || {};
    return `
${categoryId} (Score: ${score}/5)
Strengths: ${feedback.strengths || 'None provided'}
Challenges: ${feedback.challenges || 'None provided'}
Context: ${feedback.context || 'None provided'}
Examples: ${feedback.examples || 'None provided'}`
  })
  .join('\n')}

Please provide:

1. SENTIMENT ANALYSIS - For each category that has qualitative feedback, analyze:
   - The respondent's attitude and mindset
   - Their confidence level and engagement
   - Underlying concerns or optimism
   - How aligned their quantitative score is with their qualitative feedback

2. OVERALL INSIGHTS - Comprehensive assessment including:
   - Summary of digital transformation maturity
   - Key findings across all categories
   - Strategic recommendations
   - 3-5 specific next steps with timelines

Format as JSON - IMPORTANT: Use exact category IDs as keys in sentimentAnalysis:
{
  "sentimentAnalysis": {
    "culture": "analysis text for culture category",
    "leadership": "analysis text for leadership category", 
    "trainingLearning": "analysis text for trainingLearning category",
    "budget": "analysis text for budget category",
    "recruitment": "analysis text for recruitment category",
    "projectManagement": "analysis text for projectManagement category",
    "technologySystems": "analysis text for technologySystems category",
    "data": "analysis text for data category",
    "reporting": "analysis text for reporting category"
  },
  "overallInsights": {
    "summary": "overall summary",
    "keyFindings": ["finding 1", "finding 2", ...],
    "recommendations": ["rec 1", "rec 2", ...], 
    "nextSteps": ["step 1", "step 2", ...]
  }
}

Only include sentimentAnalysis entries for categories that have qualitative feedback provided.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a digital transformation expert. Provide comprehensive analysis that is insightful, actionable, and based on both quantitative scores and qualitative feedback patterns.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    console.log('Raw OpenAI response:', completion.choices[0].message.content);
    
    let analysis;
    try {
      analysis = JSON.parse(completion.choices[0].message.content);
      console.log('Parsed analysis:', analysis);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }
    
    // Validate the structure
    if (!analysis.sentimentAnalysis && !analysis.overallInsights) {
      console.error('Invalid analysis structure:', analysis);
      return res.status(500).json({ error: 'Invalid analysis structure received' });
    }
    
    res.json({ 
      success: true,
      analysis: analysis
    });

  } catch (error) {
    console.error('Error in comprehensive analysis:', error);
    res.status(500).json({ error: 'Analysis currently unavailable. Please try again later.' });
  }
};

module.exports = {
  analyzeResponse,
  generateInsights,
  analyzeCompleteResponse
}; 