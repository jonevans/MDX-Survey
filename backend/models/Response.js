const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date
  },
  
  // Store answers for each question
  answers: [
    {
      questionId: {
        type: Number,
        required: true
      },
      category: {
        type: String,
        required: true
      },
      score: {
        type: Number,
        required: true
      }
    }
  ],
  
  // Store qualitative feedback for each category
  categoryFeedback: {
    culture: {
      strengths: String,
      challenges: String,
      context: String,
      examples: String
    },
    leadership: {
      strengths: String,
      challenges: String,
      context: String,
      examples: String
    },
    trainingLearning: {
      strengths: String,
      challenges: String,
      context: String,
      examples: String
    },
    budget: {
      strengths: String,
      challenges: String,
      context: String,
      examples: String
    },
    recruitment: {
      strengths: String,
      challenges: String,
      context: String,
      examples: String
    },
    projectManagement: {
      strengths: String,
      challenges: String,
      context: String,
      examples: String
    },
    technologySystems: {
      strengths: String,
      challenges: String,
      context: String,
      examples: String
    },
    data: {
      strengths: String,
      challenges: String,
      context: String,
      examples: String
    },
    reporting: {
      strengths: String,
      challenges: String,
      context: String,
      examples: String
    }
  },
  
  // Store section completion status
  sectionProgress: {
    culture: { type: Boolean, default: false },
    leadership: { type: Boolean, default: false },
    trainingLearning: { type: Boolean, default: false },
    budget: { type: Boolean, default: false },
    recruitment: { type: Boolean, default: false },
    projectManagement: { type: Boolean, default: false },
    technologySystems: { type: Boolean, default: false },
    data: { type: Boolean, default: false },
    reporting: { type: Boolean, default: false }
  },
  
  // Scoring information
  scoringSummary: {
    totalScore: { type: Number },
    maturityLevel: { type: String },
    categoryScores: {
      culture: { type: Number },
      leadership: { type: Number },
      trainingLearning: { type: Number },
      budget: { type: Number },
      recruitment: { type: Number },
      projectManagement: { type: Number },
      technologySystems: { type: Number },
      data: { type: Number },
      reporting: { type: Number }
    },
    strengthAreas: [{ type: String }],
    improvementAreas: [{ type: String }],
    // Add AI-generated insights
    aiInsights: {
      summary: String,
      keyFindings: [String],
      recommendations: [String],
      actionItems: [String]
    }
  }
});

module.exports = mongoose.model('Response', ResponseSchema);
