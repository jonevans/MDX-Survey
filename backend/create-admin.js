const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dx-assessment');
    console.log('MongoDB Connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'jon@admin.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: jon@admin.com');
      console.log('You can reset the password if needed.');
      process.exit(0);
    }

    // Generate password
    const password = 'AdminPass123';
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const adminUser = new User({
      email: 'jon@admin.com',
      password: hashedPassword,
      fullName: 'Jon Administrator',
      companyName: 'Impact Systems',
      department: 'Administration',
      jobTitle: 'System Administrator',
      isAdmin: true
    });

    await adminUser.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: jon@admin.com');
    console.log('🔑 Password: AdminPass123');
    console.log('👑 Admin privileges: Enabled');
    console.log('');
    console.log('You can now login and access:');
    console.log('- /admin/dashboard');
    console.log('- /admin/companies');
    console.log('- /admin/responses');
    console.log('- AI analysis tools');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();