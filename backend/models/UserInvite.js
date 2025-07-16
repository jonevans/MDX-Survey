const mongoose = require('mongoose');
const crypto = require('crypto');

const userInviteSchema = new mongoose.Schema({
  companySurvey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanySurvey',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  token: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'registered', 'completed', 'expired'],
    default: 'pending'
  },
  registeredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  registeredAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate secure token before saving
userInviteSchema.pre('save', function(next) {
  if (this.isNew && !this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Method to generate registration URL
userInviteSchema.methods.getRegistrationUrl = function(baseUrl) {
  const defaultUrl = process.env.FRONTEND_URL || 
    (process.env.NODE_ENV === 'production' ? 'https://dx-assessment-frontend.onrender.com' : 'http://localhost:3000');
  const url = baseUrl || defaultUrl;
  return `${url}/register?token=${this.token}`;
};

// Method to check if invite is valid
userInviteSchema.methods.isValid = function() {
  return this.status === 'pending' && this.expiresAt > new Date();
};

// Static method to find valid invite by token
userInviteSchema.statics.findValidByToken = function(token) {
  return this.findOne({
    token,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  }).populate('companySurvey');
};

// Indexes for efficient querying
userInviteSchema.index({ token: 1 });
userInviteSchema.index({ companySurvey: 1, status: 1 });
userInviteSchema.index({ email: 1 });
userInviteSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('UserInvite', userInviteSchema);