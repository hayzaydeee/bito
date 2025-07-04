# Bito Backend API

A robust Node.js/Express backend for the Bito habit tracking application with MongoDB, authentication, and OAuth support.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Local registration/login
  - OAuth integration (Google, GitHub)
  - Password reset functionality
  - Session management

- **Database**
  - MongoDB with Mongoose ODM
  - User management
  - Habit tracking with statistics
  - Habit entries with flexible data

- **Security**
  - Password hashing with bcrypt
  - Rate limiting
  - CORS protection
  - Input validation and sanitization
  - Helmet for security headers

- **API Features**
  - RESTful API design
  - Comprehensive error handling
  - Request validation
  - Pagination support
  - Data export functionality

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd bito-backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/bito-db

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# OAuth Credentials (optional, for OAuth features)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Session Secret
SESSION_SECRET=your-session-secret-change-this-in-production

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

4. Start the development server
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt-token>
```

#### OAuth Login
```http
GET /api/auth/google
GET /api/auth/github
```

### User Endpoints

#### Get Profile
```http
GET /api/users/profile
Authorization: Bearer <jwt-token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "preferences": {
    "theme": "dark",
    "emailNotifications": false
  }
}
```

#### Get User Statistics
```http
GET /api/users/stats
Authorization: Bearer <jwt-token>
```

### Habit Endpoints

#### Get All Habits
```http
GET /api/habits?page=1&limit=10&category=health&active=true
Authorization: Bearer <jwt-token>
```

#### Create Habit
```http
POST /api/habits
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Drink Water",
  "description": "Drink 8 glasses of water daily",
  "category": "health",
  "frequency": "daily",
  "target": {
    "value": 8,
    "unit": "glasses"
  },
  "schedule": {
    "days": [1, 2, 3, 4, 5],
    "reminderTime": "09:00"
  }
}
```

#### Check/Uncheck Habit
```http
POST /api/habits/:id/check
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "date": "2025-06-23",
  "completed": true,
  "value": 8,
  "notes": "Felt great today!",
  "mood": 5
}
```

#### Get Habit Statistics
```http
GET /api/habits/stats?startDate=2025-06-01&endDate=2025-06-23
Authorization: Bearer <jwt-token>
```

## Database Schema

### User Model
- Authentication (email, password, OAuth IDs)
- Profile information (name, avatar, preferences)
- Account settings and security

### Habit Model
- Basic information (name, description, category)
- Configuration (frequency, target, schedule)
- Statistics (streaks, completion rates)

### HabitEntry Model
- Daily habit tracking data
- Completion status and values
- Notes and mood tracking

## OAuth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Secret to `.env`

### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
4. Copy Client ID and Secret to `.env`

## Development

### Available Scripts

```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm test         # Run tests
npm run seed     # Seed database with sample data
```

### Project Structure

```
bito-backend/
├── config/
│   └── passport.js         # Passport authentication strategies
├── middleware/
│   ├── auth.js            # Authentication middleware
│   ├── errorHandler.js    # Global error handling
│   ├── notFound.js        # 404 handler
│   └── validation.js      # Request validation rules
├── models/
│   ├── User.js            # User model
│   ├── Habit.js           # Habit model
│   └── HabitEntry.js      # Habit entry model
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── users.js           # User management routes
│   └── habits.js          # Habit tracking routes
├── scripts/
│   └── seedData.js        # Database seeding script
├── server.js              # Main application file
├── package.json
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/bito-db |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Optional |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | Optional |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | Optional |
| `SESSION_SECRET` | Session signing secret | Required |
| `FRONTEND_URL` | Frontend application URL | http://localhost:5173 |

## Security Features

- **Password Security**: Bcrypt hashing with salt rounds
- **JWT Security**: Secure token generation and validation
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configurable CORS settings
- **Input Validation**: Comprehensive request validation
- **Security Headers**: Helmet middleware for security headers
- **Session Security**: Secure session configuration

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "details": ["Validation error details..."]
}
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong, unique secrets for JWT and session
3. Configure MongoDB Atlas or production database
4. Set up proper CORS origins
5. Enable HTTPS
6. Configure OAuth redirect URLs for production domain
7. Set up monitoring and logging

## Support

For issues and questions:
1. Check the API documentation above
2. Review error messages and logs
3. Ensure all environment variables are set correctly
4. Verify database connection

## License

MIT License
