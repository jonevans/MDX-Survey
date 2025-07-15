const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  responseCount: {
    type: Number,
    default: 0
  },
  
  // Aggregated scoring for the company
  aggregatedScores: {
    averageTotal: { type: Number },
    companyMaturityLevel: { type: String },
    categoriesAverage: {
      culture: { type: Number },
      leadership: { type: Number },
      trainingLearning: { type: Number },
      budget: { type: Number },
      recruitment: { type: Number },
      projectManagement: { type: Number },
      technologySystems: { type: Number },
      data: { type: Number },
      reporting: { type: Number }
    }
  },
  
  // Track highest and lowest scoring categories
  strengthAreas: [{ type: String }],
  improvementAreas: [{ type: String }]
});

module.exports = mongoose.model('Company', CompanySchema);
