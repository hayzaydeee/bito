# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bito is a smart collaborative habit tracking platform built with React 19 frontend and Node.js/Express backend, using MongoDB for data persistence. The application features real-time collaboration, customizable dashboards with drag-and-drop widgets, and advanced analytics.

## Development Commands

### Frontend (`bito-frontend/`)
- `npm run dev` - Start Vite development server with HMR
- `npm run build` - Build for production 
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

### Backend (`bito-backend/`)
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run Jest test suite
- `npm run seed` - Populate database with sample data
- `npm run fix-workspaces` - Fix workspace member associations
- `npm run test-membership` - Test workspace membership functionality

## Architecture Overview

### Frontend Structure
- **React 19** with Vite for fast development and builds
- **Component Architecture**: Organized into feature-based directories (`components/analytics/`, `components/dashboard/`, etc.)
- **Widget System**: Drag-and-drop dashboard with React Grid Layout and customizable widgets
- **Context Providers**: AuthContext, HabitContext, NotificationContext, ThemeContext for state management
- **Routing**: React Router 6 with protected routes and OAuth callbacks
- **Styling**: TailwindCSS 4 with Radix UI Themes and custom CSS variables for theming

### Backend Structure
- **Express.js** server with MongoDB/Mongoose ODM
- **Authentication**: JWT + Passport.js supporting local, Google OAuth, and GitHub OAuth
- **Security**: Helmet, CORS, rate limiting, session management with MongoDB store
- **API Routes**: RESTful endpoints for habits, workspaces, users, encouragements, templates
- **Models**: Mongoose schemas for User, Habit, Workspace, HabitEntry, JournalEntry, etc.

### Key Data Models
- **User**: Authentication, preferences, workspace memberships
- **Workspace**: Collaborative spaces with member roles and shared habits
- **Habit**: Core tracking entity with schedules, categories, and completion data
- **HabitEntry**: Individual completion records with timestamps
- **JournalEntry/EnhancedJournalEntry**: Rich text journaling with BlockNote integration
- **Template**: Reusable habit and journal templates

### Widget System
The frontend uses a modular widget architecture:
- **Core Widgets**: QuickActionsWidget, MemberProgressWidget, GroupOverviewWidget
- **Analytics Widgets**: CompletionRateChart, HabitStreakChart, WeeklyHeatmap, TopHabits, InsightsPanel
- **Database Widgets**: HabitsTableView, GalleryView with filtering and sorting
- **ResizableWidget**: Wrapper component for grid layout integration

### Authentication Flow
1. **Local Auth**: Email/password with JWT tokens and refresh mechanism
2. **OAuth**: Google/GitHub integration via Passport strategies
3. **Session Management**: Express sessions with MongoDB store for persistence
4. **Protected Routes**: Frontend route guards and backend middleware validation

### Database Design
- **MongoDB** with Mongoose ODM
- **Collections**: users, workspaces, habits, habitentries, journalentries, templates, encouragements
- **Relationships**: User-Workspace many-to-many, Habit-HabitEntry one-to-many
- **Indexing**: Optimized queries for user habits, workspace members, and date ranges

### Environment Configuration
**Frontend (.env.local):**
```
VITE_API_URL=http://localhost:5000
VITE_NODE_ENV=development
```

**Backend (.env):**
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bito-dev
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=oauth-client-id
GOOGLE_CLIENT_SECRET=oauth-client-secret
OPENAI_API_KEY=openai-api-key
```

## Development Guidelines

### Code Organization
- Follow existing patterns when adding new components or features
- Use TypeScript-style JSX with proper prop validation
- Place reusable components in `components/shared/` or `components/ui/`
- Feature-specific components go in their respective directories

### Widget Development
- Extend existing widget patterns for consistency
- Use ResizableWidget wrapper for grid integration
- Export widgets from their respective index.js files
- Follow responsive design patterns with CSS Grid and Flexbox

### API Development
- Use async/await with express-async-errors for error handling
- Implement proper validation with express-validator
- Follow RESTful conventions for new endpoints
- Add tests for new routes in `__tests__/routes/`

### Database Operations
- Use Mongoose schemas with proper validation
- Implement proper error handling for database operations
- Consider indexing for performance on frequently queried fields
- Use transactions for multi-document operations when needed

### Testing
- Backend tests use Jest with Supertest
- Test files located in `__tests__/` directories
- Run tests with `npm test` in backend directory
- Write integration tests for new API endpoints

## Common Patterns

### Widget Creation
```javascript
const CustomWidget = ({ title, data, onUpdate }) => {
  return (
    <div className="widget-container">
      <div className="widget-header">
        <h3>{title}</h3>
      </div>
      <div className="widget-content">
        {/* Widget implementation */}
      </div>
    </div>
  );
};
```

### API Route Structure
```javascript
const router = express.Router();

// GET /api/resource
router.get('/', auth, async (req, res) => {
  // Implementation with proper error handling
});

module.exports = router;
```

### Context Provider Pattern
```javascript
export const CustomProvider = ({ children }) => {
  const [state, setState] = useState(initialState);
  
  const value = {
    state,
    actions: { /* action methods */ }
  };

  return (
    <CustomContext.Provider value={value}>
      {children}
    </CustomContext.Provider>
  );
};
```

## Recent Development

The project is actively being enhanced with:
- **BlockNote Integration**: Rich text journaling with enhanced editor capabilities
- **Template System**: Reusable habit and journal templates
- **Enhanced Analytics**: More sophisticated data visualization and insights
- **Improved Widget System**: Better responsive design and user experience

When working on new features, prioritize consistency with existing patterns and maintain the modular architecture that supports the collaborative, widget-based dashboard system.

# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

## BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED
Any Bash command containing `curl` or `wget` is intercepted and replaced with an error message. Do NOT retry.
Instead use:
- `ctx_fetch_and_index(url, source)` to fetch and index web pages
- `ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED
Any Bash command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` is intercepted and replaced with an error message. Do NOT retry with Bash.
Instead use:
- `ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### WebFetch — BLOCKED
WebFetch calls are denied entirely. The URL is extracted and you are told to use `ctx_fetch_and_index` instead.
Instead use:
- `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Bash (>20 lines output)
Bash is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:
- `ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### Read (for analysis)
If you are reading a file to **Edit** it → Read is correct (Edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `ctx_execute_file(path, language, code)` instead. Only your printed summary enters context. The raw file content stays in the sandbox.

### Grep (large results)
Grep results can flood context. Use `ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `ctx_execute(language, code)` | `ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Subagent routing

When spawning subagents (Agent/Task tool), the routing block is automatically injected into their prompt. Bash-type subagents are upgraded to general-purpose so they have access to MCP tools. You do NOT need to manually instruct subagents about context-mode.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `ctx_search(source: "label")` later.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call the `ctx_stats` MCP tool and display the full output verbatim |
| `ctx doctor` | Call the `ctx_doctor` MCP tool, run the returned shell command, display as checklist |
| `ctx upgrade` | Call the `ctx_upgrade` MCP tool, run the returned shell command, display as checklist |
