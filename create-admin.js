const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const User = require('./backend/models/User');

// Load environment variables
require('dotenv').config({ path: './backend/.env' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function askPassword(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let password = '';
    stdin.on('data', function(char) {
      char = char + '';
      
      switch(char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          stdout.write('*');
          break;
      }
    });
  });
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  // At least 12 characters, uppercase, lowercase, number, special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
  return passwordRegex.test(password);
}

async function createAdmin() {
  try {
    console.log('🔐 SECURE ADMIN CREATION');
    console.log('========================');
    console.log('This will create a system administrator account.');
    console.log('');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dx-assessment');
    console.log('✅ Connected to MongoDB');

    // Get admin details
    let email;
    do {
      email = await askQuestion('Enter admin email: ');
      if (!validateEmail(email)) {
        console.log('❌ Invalid email format. Please try again.');
      }
    } while (!validateEmail(email));

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('❌ User with this email already exists');
      rl.close();
      mongoose.connection.close();
      process.exit(1);
    }

    const fullName = await askQuestion('Enter admin full name: ');
    
    let password;
    do {
      password = await askPassword('Enter secure password (12+ chars, A-Z, a-z, 0-9, @$!%*?&): ');
      if (!validatePassword(password)) {
        console.log('❌ Password must be at least 12 characters with uppercase, lowercase, number, and special character (@$!%*?&).');
      }
    } while (!validatePassword(password));

    const confirmPassword = await askPassword('Confirm password: ');
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      rl.close();
      mongoose.connection.close();
      process.exit(1);
    }

    // Hash password with strong salt
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const adminUser = new User({
      email,
      password: hashedPassword,
      fullName,
      companyName: 'Administration',
      department: 'Administration',
      jobTitle: 'System Administrator',
      isAdmin: true
    });

    await adminUser.save();
    console.log('');
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', email);
    console.log('👤 Name:', fullName);
    console.log('👑 Admin privileges: Enabled');
    console.log('');
    console.log('🔒 Security Reminders:');
    console.log('- Store credentials securely');
    console.log('- Consider enabling 2FA for production');
    console.log('- Regularly rotate passwords');
    console.log('- Monitor admin access logs');
    console.log('');
    console.log('You can now access:');
    console.log('- Admin Dashboard: /admin');
    console.log('- Company Management: /admin/companies');
    console.log('- Response Management: /admin/responses');
    console.log('- Survey Campaigns: /admin/surveys');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    mongoose.connection.close();
  }
}

createAdmin();