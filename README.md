# Bito - Smart Collaborative Habit Tracking 🎯

[![Web App](https://img.shields.io/badge/Web%20Apps-bito.works-blue?style=for-the-badge)](https://bito.works)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Backend](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com/)

> **Transform habit formation from a solo struggle into a shared journey of growth and accountability.**

Bito is a next-generation habit tracking platform that combines the power of customizable dashboards, real-time collaboration, to make building positive habits more effective and enjoyable than ever before.

## 🌟 What Makes Bito Special

**🎨 Fully Customizable Dashboards**  
Create your perfect tracking experience with drag-and-drop widgets, resizable components, and personalized layouts that adapt to your workflow.

**👥 Real-Time Collaboration**  
Build habits together with friends, family, or teams through shared workspaces, live updates, and social accountability features.


**📊 Rich Analytics & Insights**  
Beautiful visualizations including streak charts, completion heatmaps, progress analytics, and performance leaderboards.

**🔗 Smart Integrations**  
Seamlessly import data from existing systems with our LLM-powered CSV analyzer that understands any data structure.

## 🚀 Web App

**Visit [bito.works](https://bito.works)** to experience Bito in action!

## ✨ Core Features

### 🎛️ Dynamic Dashboard System
- **Drag & Drop Interface**: Intuitive React Grid Layout with smooth interactions
- **Widget Ecosystem**: Modular components for habits, charts, quick actions, and analytics
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices
- **Persistent Layouts**: Your customizations are saved and synced across devices

### 📈 Advanced Analytics Engine
- **Streak Visualization**: Track consistency patterns and celebrate milestones
- **Completion Heatmaps**: GitHub-style activity calendars showing daily progress
- **Performance Charts**: Line and bar charts for trend analysis and goal tracking
- **Top Performers**: Leaderboards for most active habits and best completion rates
- **Insights Panel**: Smart recommendations based on your habit patterns

### 🤝 Collaborative Workspaces
- **Team Dashboards**: Shared spaces for families, friends, or colleagues
- **Real-Time Updates**: Live synchronization of habit completions and progress
- **Member Management**: Invite others with role-based permissions
- **Group Challenges**: Collective goals and friendly competition
- **Activity Feeds**: Stay connected with team progress and achievements

### 🔐 Robust Authentication
- **Multiple Login Methods**: Email/password, Google OAuth, GitHub OAuth
- **JWT Security**: Secure token-based authentication with refresh rotation
- **Session Management**: Persistent login with automatic token refresh
- **Password Recovery**: Secure reset flows with email verification

## 🏗️ Technical Architecture

### Frontend Stack
```
React 19              # Latest React with concurrent features
TypeScript           # Type-safe development (where applicable)
Vite                 # Ultra-fast build tooling and HMR
TailwindCSS 4        # Utility-first styling with custom design system
Radix UI Themes      # Accessible component primitives
React Grid Layout    # Drag-and-drop dashboard system
React Router 6       # Client-side routing and navigation
Recharts            # Beautiful, responsive data visualizations
dnd-kit             # Modern drag-and-drop interactions
```

### Backend Stack
```
Node.js + Express    # RESTful API server
MongoDB + Mongoose   # Document database with ODM
JWT + Passport       # Authentication and authorization
bcrypt              # Secure password hashing
Helmet + CORS       # Security middleware
Rate Limiting       # API protection and abuse prevention
Session Management  # Secure session handling
```

### Infrastructure & Deployment
```
Frontend: Vercel      # Global CDN with automatic deployments
Backend: Railway      # Cloud platform with database hosting
Database: MongoDB Atlas  # Managed MongoDB in the cloud
Domain: bito.works    # Custom domain
CI/CD: Git-based     # Automatic deployments on push
```

## 🎯 Key User Flows (MVP)

### 1. **Onboarding Experience**
- Create account with email & password

### 2. **Daily Habit Tracking**
- Quick-access widget for rapid habit logging
- Visual progress indicators and streak counters

### 3. **Team Collaboration**
- Create or join workspaces with invitation links
- Set up shared habits and team challenges
- Real-time activity feed showing team progress
- Celebrate milestones and achievements together

### 4. **Analytics & Insights**
- Comprehensive analytics dashboard with multiple chart types
- Customizable time ranges and filtering options

## 🎨 Design Philosophy

Bito follows a clean, modern design language that prioritizes usability and visual hierarchy:

## **Dark Indigo Theme**

### **CSS**
/* Example of our comprehensive color system */
--color-brand-500: #6366f1;     /* Primary indigo */
--color-bg-primary: #0f0f23;    /* Deep space background */
--color-surface-elevated: #2a2a5c; /* Elevated card surfaces */
--color-text-primary: #f8fafc;  /* High contrast text */

### **Brand Colors**

Indigo Brand Scale: #6366f1 (primary) to #1e1b4b (darkest)
Dark Theme Backgrounds: Deep space blues (#0f0f23 to #2d2d66)
Surface Elevations: Layered indigo surfaces (#1e1e42 to #303066)
Status Colors: Success #10b981, Warning #f59e0b, Error #ef4444, Info #3b82f6

### **Typography**

Headings: DM Serif Text (elegant, readable serif)
Body: Outfit (clean, modern sans-serif)
UI Elements: Optimized for clarity and accessibility

## 🛠️ Development Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn
- MongoDB (local or Atlas)
- Git

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/bito.git
cd bito
```

2. **Frontend Setup**
```bash
cd bito-frontend
npm install
cp .env.example .env.local
# Configure environment variables
npm run dev
```

3. **Backend Setup**
```bash
cd bito-backend
npm install
cp .env.example .env
# Configure environment variables (MongoDB, JWT secret, OAuth keys)
npm run dev
```

4. **Environment Configuration**

**Frontend (.env.local):**
```env
VITE_API_URL=http://localhost:5000
VITE_NODE_ENV=development
```

**Backend (.env):**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bito-dev
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_CLIENT_ID=your-google-oauth-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
OPENAI_API_KEY=your-openai-api-key
```

### Available Scripts

**Frontend:**
- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

**Backend:**
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run seed` - Populate database with sample data

## 📁 Project Structure

```
bito/
├── bito-frontend/                 # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── analytics/         # Data visualization components
│   │   │   ├── dashboard/         # Main dashboard interface
│   │   │   ├── layout/           # App layout and navigation
│   │   │   ├── shared/           # Reusable UI components
│   │   │   ├── ui/               # Base UI components
│   │   │   └── widgets/          # Dashboard widget system
│   │   ├── contexts/             # React Context providers
│   │   ├── hooks/                # Custom React hooks
│   │   ├── pages/                # Route components
│   │   ├── services/             # API and external services
│   │   └── utils/                # Helper functions
│   ├── public/                   # Static assets
│   └── package.json
│
├── bito-backend/                  # Node.js API server
│   ├── config/                   # App configuration
│   ├── controllers/              # Route controllers
│   ├── middleware/               # Express middleware
│   ├── models/                   # MongoDB schemas
│   ├── routes/                   # API route definitions
│   ├── services/                 # Business logic services
│   ├── scripts/                  # Database scripts
│   └── server.js                 # Application entry point
│
└── README.md                     # This file
```

## 🔌 API Documentation

### Authentication Endpoints
```http
POST /api/auth/register          # Create new account
POST /api/auth/login             # Email/password login
GET  /api/auth/google            # Google OAuth flow
GET  /api/auth/github            # GitHub OAuth flow
POST /api/auth/refresh           # Refresh access token
POST /api/auth/logout            # End user session
```

### Habit Management
```http
GET    /api/habits               # Get user habits
POST   /api/habits               # Create new habit
PUT    /api/habits/:id           # Update habit
DELETE /api/habits/:id           # Delete habit
POST   /api/habits/:id/toggle    # Toggle completion
GET    /api/habits/stats         # Get analytics data
```

### Workspace Collaboration
```http
GET    /api/workspaces           # Get user workspaces
POST   /api/workspaces           # Create workspace
GET    /api/workspaces/:id       # Get workspace details
PUT    /api/workspaces/:id       # Update workspace
POST   /api/workspaces/:id/invite # Invite members
```

## 🌈 Advanced Features

### 🎛️ Widget System Architecture
```javascript
// Custom widget development
const CustomWidget = ({ title, data, onUpdate }) => {
  return (
    <WidgetContainer title={title}>
      <YourCustomVisualization data={data} />
    </WidgetContainer>
  );
};

// Register in widget system
registerWidget('custom-analytics', CustomWidget);
```

### 🔄 Real-Time Collaboration
```javascript
// WebSocket integration for live updates
socket.on('habit-completed', (data) => {
  updateWorkspaceActivity(data);
  showNotification(`${data.user} completed ${data.habit}!`);
});
```

## 🎯 Usage Examples

### Individual Habit Tracking
Perfect for personal productivity, fitness goals, learning new skills, or building any positive routine.

### Team Accountability
Ideal for remote teams building work habits, families tracking household responsibilities, or study groups maintaining academic discipline.

### Health & Wellness
Great for fitness challenges, mindfulness practices, dietary goals, or recovery programs with professional guidance.

### Educational Settings
Useful for student habit formation, classroom behavior tracking, or institutional wellness programs.

## 🚀 Deployment

Bito is deployed with modern cloud infrastructure for reliability and performance:

### Production Environment
- **Frontend**: Vercel with global CDN
- **Backend**: Railway cloud platform
- **Database**: MongoDB Atlas cluster

### Environment Variables (Production)
All sensitive configuration is managed through environment variables with proper secret management and rotation policies.

## 🤝 Contributing

We welcome contributions to make Bito even better! Here's how you can help:

### Development Guidelines
1. Fork the repository and create a feature branch
2. Follow the existing code style and conventions
3. Write tests for new functionality
4. Update documentation for significant changes
5. Submit a pull request with a clear description

### Areas for Contribution
- 🧩 New widget types for different tracking needs
- 🎨 UI/UX improvements and accessibility enhancements
- 🤖 AI feature expansions and smarter insights
- 🔗 Additional third-party integrations
- 📊 Advanced analytics and visualization options
- 📱 Mobile app development (React Native)

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Design Inspiration**: Modern productivity apps and collaborative tools
- **Technical Foundation**: React, Node.js, and MongoDB ecosystems
- **UI Components**: Radix UI for accessible design primitives
- **Deployment**: Vercel and Railway for seamless hosting

## 📞 Support & Community

- 🌐 **Website**: [bito.works](https://bito.works)
- 📧 **Email**: hayzayd33@gmail.com
- 🐛 **Issues**: GitHub Issues for bug reports
- 💡 **Feature Requests**: GitHub Discussions
- 📚 **Documentation**: Built-in help system and tooltips

---

**Built with ❤️ by developers who believe that building better habits should be a shared journey of growth, accountability, and celebration.**

*Ready to transform your habits? [Get started at bito.works](https://bito.works)*
