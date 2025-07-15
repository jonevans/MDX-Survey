# DX Assessment Application

A secure, enterprise-grade MERN stack application for conducting Digital Transformation maturity assessments with invite-only registration and comprehensive admin management.

## 🔒 Security Features

- **Invite-only registration system** with unique token-based URLs
- **JWT authentication** with secure token management
- **Admin privilege separation** with role-based access control
- **Rate limiting** on all endpoints to prevent abuse
- **Input validation and XSS protection** on all user inputs
- **Password hashing** with bcrypt
- **CORS and security headers** configured
- **Environment-based configuration** for secure deployments

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- OpenAI API key (optional, for AI insights)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd dx-assessment-app
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cd ../backend
   cp .env.example .env
   ```

4. **Configure Environment Variables**
   
   Edit `backend/.env` with your configuration:
   ```env
   PORT=5050
   MONGO_URI=mongodb://localhost:27017/dx-assessment
   JWT_SECRET=your_secure_jwt_secret_here
   OPENAI_API_KEY=your_openai_api_key_here
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   ```

   **⚠️ Security Notes:**
   - Generate a secure JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - Never commit your `.env` file to version control
   - Use different secrets for each environment

5. **Create Admin User**
   ```bash
   cd backend
   node create-admin.js
   ```

6. **Start the Application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

## 📋 Admin Workflow

### Setting Up Company Surveys

1. **Login as Admin** and navigate to the admin dashboard
2. **Click "🚀 Company Surveys"** to manage survey campaigns
3. **Create New Survey** with company details
4. **Add Invites** using one of these formats:
   - `John Doe <john@example.com>`
   - `john@example.com, John Doe`
   - `john@example.com`
5. **Generate Registration URLs** and distribute to invited users
6. **Track Progress** and view completion status

### Managing Responses

- **View All Responses** - See completed assessments
- **Response Details** - Deep dive into individual submissions
- **AI Analysis** - Generate sentiment analysis and insights
- **Company Statistics** - Track completion rates and scores

## 🏗️ Architecture

### Backend Structure
```
backend/
├── controllers/        # Request handling logic
├── middleware/         # Authentication, validation, rate limiting
├── models/            # MongoDB schemas
├── routes/            # API endpoints
├── services/          # Business logic
└── config/            # Configuration files
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Route components
│   ├── context/       # React context for state management
│   └── config/        # Configuration files
```

## 🔐 Security Best Practices

### For Development
- Use strong, unique passwords for admin accounts
- Keep dependencies updated with `npm audit`
- Never commit sensitive data to version control
- Use environment variables for all configuration

### For Production
- Enable HTTPS with SSL certificates
- Use strong JWT secrets (64+ characters)
- Configure production-ready rate limits
- Enable MongoDB authentication
- Set up monitoring and logging
- Regular security audits and updates

## 🚦 API Rate Limits

- **Authentication endpoints**: 100 requests per 15 minutes
- **General API**: 1000 requests per 15 minutes (development)
- **AI endpoints**: 10 requests per hour
- **Authenticated users**: 200 requests per 15 minutes

## 🗄️ Database Schema

### Collections
- **users** - User accounts with authentication data
- **responses** - Assessment submissions and scores
- **companies** - Company aggregated data
- **companysurveys** - Survey campaign management
- **userinvites** - Invitation tracking with tokens

## 🤖 AI Features

- **Sentiment Analysis** - Per-category qualitative feedback analysis
- **AI Insights** - Comprehensive assessment summaries
- **Recommendations** - Actionable improvement suggestions
- **Mock Mode** - Fallback when OpenAI API is unavailable

## 📊 Assessment Scoring

- **18 questions** across 9 categories
- **Weighted scoring** with maturity level calculation
- **Category analysis** with strengths/improvement areas
- **Company benchmarking** and comparison

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5050) |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | No |
| `FRONTEND_URL` | Frontend URL for CORS | No |
| `NODE_ENV` | Environment (development/production) | No |

### Security Configuration

The application includes several security middleware:
- **Helmet.js** for security headers
- **CORS** with origin restrictions
- **Rate limiting** with express-rate-limit
- **Input validation** with express-validator
- **XSS protection** with xss library

## 🚨 Troubleshooting

### Common Issues

1. **"Too many requests"** - Wait for rate limit reset or increase limits in development
2. **"Invalid token"** - Check JWT_SECRET configuration
3. **"Registration requires invitation"** - User needs valid invite link
4. **MongoDB connection errors** - Verify MONGO_URI and database accessibility

### Development Tips

- Use `console.log` statements for debugging (remove in production)
- Check network tab in browser dev tools for API errors
- Verify environment variables are loaded correctly
- Use MongoDB Compass for database inspection

## 📝 License

This project is proprietary and confidential.

## 🤝 Contributing

1. Follow security best practices
2. Never commit sensitive data
3. Test all changes thoroughly
4. Update documentation as needed

---

**⚠️ Security Reminder**: This application handles sensitive business data. Always follow security best practices and conduct regular security reviews before production deployment.