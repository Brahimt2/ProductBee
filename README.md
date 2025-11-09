# ProductBee

An AI-powered roadmap dashboard that accelerates product development, optimizes lifecycle productivity, and keeps cross-functional teams on the same page.

## Features

1. **AI-Powered Roadmap Generation** - Generate comprehensive project roadmaps using Google Gemini AI
2. **Feature Prioritization** - Automatically prioritize features with P0, P1, P2 labels
3. **Timeline Estimation** - Get effort estimates for each feature
4. **Kanban Board** - Visualize features across Backlog, In Progress, Blocked, and Complete
5. **Collaborative Feedback** - Engineers can leave comments and proposals
6. **AI Proposal Analysis** - Automatic analysis of engineer proposals with timeline impact
7. **Role-Based Access** - PM, Engineer, Admin, and Viewer roles with appropriate permissions

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React Server Components, Tailwind CSS
- **Auth:** Auth0
- **Database:** MongoDB + Mongoose
- **AI:** Google Gemini API
- **UI:** React Hot Toast, Lucide Icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB instance (local or cloud)
- Auth0 account
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ProductBee
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following:

```env
# Auth0 Configuration
AUTH0_SECRET=your-auth0-secret-here
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/productbee

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key-here
```

4. Configure Auth0:

- Create an Auth0 application
- Set the callback URL to: `http://localhost:3000/api/auth/callback`
- Set the logout URL to: `http://localhost:3000`
- Copy your credentials to `.env.local`

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
/app
  /dashboard/page.tsx          # Dashboard with project list
  /project/[id]/page.tsx        # Project detail with Kanban board
  /api                          # API routes
    /roadmap/generate/route.ts  # Generate roadmap with AI
    /project/[id]/route.ts      # Get project data
    /feedback/create/route.ts   # Create feedback
    /feedback/approve/route.ts   # Approve proposal
    /feedback/reject/route.ts    # Reject proposal
/components
  FeatureCard.tsx               # Feature card component
  FeatureModal.tsx              # Feature detail modal
  CreateProjectModal.tsx        # Create project dialog
  FeedbackThread.tsx            # Feedback display component
/lib
  db.ts                         # MongoDB connection
  gemini.ts                     # Gemini API wrapper
/models                         # Mongoose models
/types                          # TypeScript types
```

## Usage

### PM Workflow

1. Create a new project by clicking "Create Project"
2. Enter project name and description
3. AI generates a structured roadmap with features
4. Review the roadmap on the project detail page
5. Approve or reject engineer proposals

### Engineer Workflow

1. Open a project from the dashboard
2. View features in the Kanban board
3. Click on a feature to open the detail modal
4. Leave comments or submit proposals
5. Proposals are automatically analyzed by AI

## API Routes

- `POST /api/roadmap/generate` - Generate roadmap from project description
- `GET /api/project/[id]` - Get project with features and feedback
- `GET /api/projects` - Get all projects
- `POST /api/feedback/create` - Create comment or proposal
- `POST /api/feedback/approve` - Approve a proposal (PM only)
- `POST /api/feedback/reject` - Reject a proposal (PM only)
- `PATCH /api/feature/[id]` - Update feature (e.g., status)

## Database Models

- **User** - Auth0 user with role (pm, engineer, admin, viewer)
- **Project** - Project with roadmap summary and risk level
- **Feature** - Feature with priority, effort estimate, and dependencies
- **Feedback** - Comments and proposals with AI analysis

## License

MIT 




