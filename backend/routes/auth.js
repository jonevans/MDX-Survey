const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserInvite = require('../models/UserInvite');
const auth = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

// @route   POST /api/auth/register
// @desc    Register a new user (invite-only)
router.post('/register', authLimiter, validateRegistration, async (req, res) => {
  console.log('Register API called');
  console.log('Request body:', req.body);
  
  try {
    const { email, password, fullName, companyName, department, jobTitle, inviteToken } = req.body;
    
    // Validate required fields
    if (!email || !password || !fullName || !companyName || !department || !jobTitle) {
      console.log('Missing required fields:', { email, password: !!password, fullName, companyName, department, jobTitle });
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate invite token if provided (invite-only registration)
    let invite = null;
    if (inviteToken) {
      invite = await UserInvite.findValidByToken(inviteToken);
      if (!invite) {
        console.log('Invalid or expired invite token:', inviteToken);
        return res.status(400).json({ message: 'Invalid or expired invitation' });
      }
      
      // Verify the email matches the invite
      if (invite.email.toLowerCase() !== email.toLowerCase()) {
        console.log('Email mismatch for invite:', { inviteEmail: invite.email, providedEmail: email });
        return res.status(400).json({ message: 'Email does not match invitation' });
      }
      
      // Verify other details match the invite
      if (invite.fullName !== fullName || invite.companyName !== companyName) {
        console.log('Details mismatch for invite:', { 
          inviteName: invite.fullName, providedName: fullName,
          inviteCompany: invite.companyName, providedCompany: companyName 
        });
        return res.status(400).json({ message: 'Registration details do not match invitation' });
      }
    } else {
      // No invite token provided - check if open registration is allowed
      // For now, we'll require invite tokens for all new registrations
      return res.status(400).json({ 
        message: 'Registration requires a valid invitation. Please contact your administrator.' 
      });
    }
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }
    
    console.log('Creating new user...');
    
    // Create new user
    user = new User({
      email,
      password, // Will be hashed below
      fullName,
      companyName,
      department,
      jobTitle,
      inviteToken: invite ? invite.token : null,
      invitedBy: invite ? invite._id : null
    });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    console.log('Saving user to database...');
    await user.save();
    console.log('User saved successfully:', user._id);
    
    // Update invite status if this was an invite-based registration
    if (invite) {
      invite.status = 'registered';
      invite.registeredUser = user._id;
      invite.registeredAt = new Date();
      await invite.save();
      console.log('Updated invite status to registered:', invite._id);
    }
    
    // Create JWT
    const payload = {
      user: {
        id: user.id
      }
    };
    
    console.log('Generating token...');
    
    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('Token generation error:', err);
          return res.status(500).json({ message: 'Token generation failed' });
        }
        
        console.log('Token generated successfully');
        
        res.json({ 
          token,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            companyName: user.companyName,
            department: user.department,
            jobTitle: user.jobTitle
          }
        });
      }
    );
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  console.log('Login API called');
  console.log('Request body:', { email: req.body.email, passwordProvided: !!req.body.password });
  
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    console.log('Looking for user with email:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    console.log('User found:', { id: user._id, email: user.email, isAdmin: user.isAdmin });
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    console.log('Password verified for user:', email);
    
    // Create JWT
    const payload = {
      user: {
        id: user.id,
        isAdmin: user.isAdmin
      }
    };
    
    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('Token generation error:', err);
          return res.status(500).json({ message: 'Token generation failed' });
        }
        
        res.json({ 
          token,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            companyName: user.companyName,
            department: user.department,
            jobTitle: user.jobTitle,
            isAdmin: user.isAdmin
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Unable to retrieve user information' });
  }
});

module.exports = router;
