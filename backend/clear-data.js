const mongoose = require('mongoose');
const Company = require('./models/Company');
const Response = require('./models/Response');
require('dotenv').config();

const clearData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dx-assessment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear companies collection
    const companiesDeleted = await Company.deleteMany({});
    console.log(`Deleted ${companiesDeleted.deletedCount} companies`);

    // Clear responses collection
    const responsesDeleted = await Response.deleteMany({});
    console.log(`Deleted ${responsesDeleted.deletedCount} responses`);

    console.log('Database cleared successfully (kept users intact)');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

clearData();