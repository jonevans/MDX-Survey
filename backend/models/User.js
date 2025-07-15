const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  inviteToken: {
    type: String,
    sparse: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserInvite'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
