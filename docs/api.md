# API Documentation

All endpoints are under `/api`, require Auth0 auth (cookie session), and enforce **account isolation** via `account_id` from Auth0 metadata. All queries automatically filter by `account_id`.

## Authentication

All endpoints (except `/api/auth/**`) require authentication via Auth0. The session is stored in HTTP-only cookies and automatically managed by the Auth0 SDK.

## Response Format

All responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated or session expired |
| `FORBIDDEN` | 403 | Insufficient permissions for this action |
| `NOT_FOUND` | 404 | Resource not found or not accessible |
| `BAD_REQUEST` | 400 | Invalid request data or validation failed |
| `INTERNAL_ERROR` | 500 | Server error or unexpected failure |

## Account Isolation

All endpoints enforce account isolation:
- `account_id` is extracted from Auth0 session metadata
- All database queries filter by `account_id`
- Users can only access resources within their account
- Admins have full access within their account only

## Permission Matrix

| Endpoint | Viewer | Engineer | PM | Admin |
|----------|--------|----------|----|----|
| `GET /api/projects` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/project/:id` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/roadmap/generate` | ❌ | ❌ | ✅ | ✅ |
| `POST /api/feature/create` | ❌ | ❌ | ✅ | ✅ |
| `PATCH /api/feature/:id` | ❌ | ❌ | ✅ | ✅ |
| `POST /api/feature/suggest-assignee` | ❌ | ❌ | ✅ | ✅ |
| `POST /api/feedback/create` | ❌ | ✅ | ✅ | ✅ |
| `POST /api/feedback/approve` | ❌ | ❌ | ✅ | ✅ |
| `POST /api/feedback/reject` | ❌ | ❌ | ✅ | ✅ |
| `GET /api/user/profile` | ✅ | ✅ | ✅ | ✅ |
| `PATCH /api/user/profile` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/team/members` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/team/members/available` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/chat/generate-tickets` | ❌ | ❌ | ✅ | ✅ |
| `POST /api/chat/apply-tickets` | ❌ | ❌ | ✅ | ✅ |

## Database vs API Format Conversions

The API uses different enum values than the database. Always use conversion functions:

| Field | API Format | Database Format | Conversion Function |
|-------|------------|-----------------|---------------------|
| Feature Status | `not_started`, `in_progress`, `blocked`, `complete` | `backlog`, `active`, `blocked`, `complete` | `statusToApi()`, `statusToDb()` |
| Priority | `critical`, `high`, `medium`, `low` | `P0`, `P1`, `P2` | `priorityToApi()`, `priorityToDb()` |
| Feedback Type | `comment`, `timeline_proposal` | `comment`, `proposal` | `feedbackTypeToApi()`, `feedbackTypeToDb()` |

**Important:** Frontend always sends/receives API format. Backend converts to/from DB format automatically.

---

# Projects

## GET `/api/projects`

Returns all projects for the user's `account_id`.

**Permissions:** All authenticated users

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "_id": "uuid",
        "id": "uuid",
        "name": "Project Name",
        "description": "Project description",
        "roadmap": {
          "summary": "Roadmap summary",
          "riskLevel": "low"
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "createdBy": {
          "name": "Creator Name",
          "email": "creator@example.com"
        }
      }
    ]
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `500 INTERNAL_ERROR` - Database error

## GET `/api/project/:id`

Returns project with features, feedback, and timeline data.

**Parameters:**
- `id` (path) - Project UUID

**Permissions:** Authenticated users; project must belong to user's account

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "_id": "uuid",
      "id": "uuid",
      "name": "Project Name",
      "description": "Project description",
      "roadmap": {
        "summary": "Roadmap summary",
        "riskLevel": "medium"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "createdBy": {
        "name": "Creator Name",
        "email": "creator@example.com"
      }
    },
    "features": [
      {
        "_id": "uuid",
        "id": "uuid",
        "projectId": "uuid",
        "title": "Feature Title",
        "description": "Feature description",
        "status": "not_started",
        "priority": "high",
        "effortEstimateWeeks": 2,
        "dependsOn": [],
        "assignedTo": "user-uuid",
        "reporter": "user-uuid",
        "storyPoints": 5,
        "labels": ["frontend", "ui"],
        "acceptanceCriteria": "Criteria here",
        "ticketType": "feature",
        "startDate": "2024-01-01",
        "endDate": "2024-01-15",
        "duration": 14,
        "isOnCriticalPath": true,
        "slackDays": 0,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "feedbackByFeature": {
      "feature-uuid": [
        {
          "_id": "uuid",
          "id": "uuid",
          "projectId": "uuid",
          "featureId": "uuid",
          "userId": {
            "name": "User Name",
            "email": "user@example.com"
          },
          "type": "comment",
          "content": "Feedback content",
          "status": "pending",
          "createdAt": "2024-01-01T00:00:00Z"
        }
      ]
    },
    "timeline": {
      "dependencyChains": [
        {
          "featureId": "uuid",
          "chain": ["uuid1", "uuid2"],
          "depth": 2
        }
      ],
      "criticalPath": {
        "path": ["uuid1", "uuid2", "uuid3"],
        "totalDuration": 42,
        "startDate": "2024-01-01",
        "endDate": "2024-02-12"
      },
      "milestones": [
        {
          "date": "2024-01-15",
          "features": ["uuid1", "uuid2"],
          "description": "2 features completing"
        }
      ],
      "overlaps": [
        {
          "feature1": "uuid1",
          "feature2": "uuid2",
          "overlapDays": 5
        }
      ]
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Project not accessible (different account)
- `404 NOT_FOUND` - Project not found
- `400 BAD_REQUEST` - Invalid project ID format

---

# Roadmap

## POST `/api/roadmap/generate`

AI-generates a project with features using Google Gemini. Creates project and features under user's `account_id`.

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "projectName": "My New Project",
  "projectDescription": "A detailed description of the project goals and requirements"
}
```

**Validation:**
- `projectName` (required) - Non-empty string
- `projectDescription` (required) - Non-empty string

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "_id": "uuid",
      "id": "uuid",
      "name": "My New Project",
      "description": "Project description",
      "roadmap": {
        "summary": "AI-generated roadmap summary",
        "riskLevel": "medium"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "features": [
      {
        "_id": "uuid",
        "id": "uuid",
        "projectId": "uuid",
        "title": "Feature Title",
        "description": "Feature description",
        "status": "not_started",
        "priority": "high",
        "effortEstimateWeeks": 2,
        "ticketType": "feature",
        "storyPoints": 5,
        "labels": ["backend"],
        "acceptanceCriteria": "Criteria here"
      }
    ]
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin
- `400 BAD_REQUEST` - Missing or invalid request body
- `500 INTERNAL_ERROR` - AI generation failed or database error

---

# Features

## POST `/api/feature/create`

Creates a feature in a project under the same `account_id`.

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "projectId": "uuid",
  "title": "Feature Title",
  "description": "Feature description",
  "priority": "high",
  "effortEstimateWeeks": 2,
  "dependsOn": ["uuid1", "uuid2"],
  "assignedTo": "user-uuid",
  "storyPoints": 5,
  "labels": ["frontend", "ui"],
  "acceptanceCriteria": "Acceptance criteria here",
  "ticketType": "feature"
}
```

**Validation:**
- `projectId` (required) - Valid UUID
- `title` (required) - Non-empty string
- `description` (required) - Non-empty string
- `priority` (required) - One of: `critical`, `high`, `medium`, `low`
- `effortEstimateWeeks` (required) - Positive integer
- `dependsOn` (optional) - Array of feature UUIDs
- `assignedTo` (optional) - User UUID or null
- `storyPoints` (optional) - Non-negative integer or null
- `labels` (optional) - Array of strings
- `acceptanceCriteria` (optional) - String or null
- `ticketType` (optional) - One of: `feature`, `bug`, `epic`, `story` (default: `feature`)

**Response:**
```json
{
  "success": true,
  "data": {
    "feature": {
      "_id": "uuid",
      "id": "uuid",
      "projectId": "uuid",
      "title": "Feature Title",
      "description": "Feature description",
      "status": "not_started",
      "priority": "high",
      "effortEstimateWeeks": 2,
      "dependsOn": ["uuid1", "uuid2"],
      "assignedTo": "user-uuid",
      "storyPoints": 5,
      "labels": ["frontend", "ui"],
      "acceptanceCriteria": "Acceptance criteria here",
      "ticketType": "feature",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin, or project not accessible
- `404 NOT_FOUND` - Project not found
- `400 BAD_REQUEST` - Invalid request data

## PATCH `/api/feature/:id`

Updates any feature fields. Feature must belong to user's `account_id`.

**Parameters:**
- `id` (path) - Feature UUID

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "status": "in_progress",
  "priority": "critical",
  "title": "Updated Title",
  "description": "Updated description",
  "effortEstimateWeeks": 3,
  "dependsOn": ["uuid1"],
  "assignedTo": "user-uuid",
  "storyPoints": 8,
  "labels": ["backend", "api"],
  "acceptanceCriteria": "Updated criteria",
  "ticketType": "bug"
}
```

**Validation:**
- All fields are optional
- `status` - One of: `not_started`, `in_progress`, `blocked`, `complete`
- `priority` - One of: `critical`, `high`, `medium`, `low`
- `effortEstimateWeeks` - Positive integer
- `dependsOn` - Array of feature UUIDs
- `assignedTo` - User UUID or null
- `storyPoints` - Non-negative integer or null
- `labels` - Array of strings
- `ticketType` - One of: `feature`, `bug`, `epic`, `story`

**Response:**
```json
{
  "success": true,
  "data": {
    "feature": {
      "_id": "uuid",
      "id": "uuid",
      "projectId": "uuid",
      "title": "Updated Title",
      "status": "in_progress",
      "priority": "critical",
      // ... other fields
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin, or feature not accessible
- `404 NOT_FOUND` - Feature not found
- `400 BAD_REQUEST` - Invalid request data

## POST `/api/feature/suggest-assignee`

AI-powered assignee suggestions using Google Gemini. Suggests engineers in the same account, excluding those on vacation, based on specialization, workload, and past experience.

**Permissions:** PM or Admin only

**Request Body (Option 1 - Task Context):**
```json
{
  "taskTitle": "Implement user authentication",
  "taskDescription": "Add OAuth2 authentication with Google and GitHub",
  "taskLabels": ["backend", "security"],
  "taskType": "feature",
  "projectId": "uuid"
}
```

**Request Body (Option 2 - Feature ID):**
```json
{
  "featureId": "uuid"
}
```

**Validation:**
- Either `taskTitle` + `taskDescription` OR `featureId` required
- `taskType` (optional) - One of: `feature`, `bug`, `epic`, `story`
- `taskLabels` (optional) - Array of strings
- `projectId` (optional) - Valid UUID
- `featureId` (optional) - Valid UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestion": {
      "requiredSpecialization": "Backend",
      "recommendations": [
        {
          "engineerId": "user-uuid",
          "engineerName": "John Doe",
          "reasoning": "Has experience with OAuth2 and backend security",
          "confidenceScore": 0.85,
          "matchFactors": {
            "specializationMatch": true,
            "workloadSuitable": true,
            "pastExperience": true
          }
        }
      ]
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin
- `404 NOT_FOUND` - Feature or project not found
- `400 BAD_REQUEST` - Invalid request data
- `500 INTERNAL_ERROR` - AI suggestion failed

---

# Feedback

## POST `/api/feedback/create`

Creates a comment or timeline proposal on a feature.

**Permissions:** Engineers, PMs, and Admins (Viewers cannot create feedback)

**Request Body:**
```json
{
  "projectId": "uuid",
  "featureId": "uuid",
  "type": "comment",
  "content": "This feature needs more clarification on the API design.",
  "proposedRoadmap": null
}
```

**For Timeline Proposal:**
```json
{
  "projectId": "uuid",
  "featureId": "uuid",
  "type": "timeline_proposal",
  "content": "I propose extending the timeline by 2 weeks due to complexity",
  "proposedRoadmap": {
    "features": [
      {
        "id": "uuid",
        "startDate": "2024-01-15",
        "endDate": "2024-02-15",
        "duration": 30
      }
    ]
  }
}
```

**Validation:**
- `projectId` (required) - Valid UUID
- `featureId` (required) - Valid UUID
- `type` (required) - One of: `comment`, `timeline_proposal`
- `content` (required) - Non-empty string
- `proposedRoadmap` (optional) - Object (required if type is `timeline_proposal`)

**Response:**
```json
{
  "success": true,
  "data": {
    "feedback": {
      "_id": "uuid",
      "id": "uuid",
      "projectId": "uuid",
      "featureId": "uuid",
      "userId": {
        "name": "User Name",
        "email": "user@example.com"
      },
      "type": "comment",
      "content": "Feedback content",
      "proposedRoadmap": null,
      "aiAnalysis": null,
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Note:** If `type` is `timeline_proposal`, AI analysis is automatically generated and included in `aiAnalysis` field.

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Viewer role (read-only)
- `404 NOT_FOUND` - Project or feature not found
- `400 BAD_REQUEST` - Invalid request data

## POST `/api/feedback/approve`

Approves a timeline proposal and applies changes to the roadmap.

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "feedbackId": "uuid"
}
```

**Validation:**
- `feedbackId` (required) - Valid UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Proposal approved and roadmap updated",
    "feedback": {
      "_id": "uuid",
      "id": "uuid",
      "status": "approved",
      // ... other fields
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin, or feedback not accessible
- `404 NOT_FOUND` - Feedback not found
- `400 BAD_REQUEST` - Invalid request data or feedback is not a proposal

## POST `/api/feedback/reject`

Rejects a timeline proposal.

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "feedbackId": "uuid"
}
```

**Validation:**
- `feedbackId` (required) - Valid UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Proposal rejected",
    "feedback": {
      "_id": "uuid",
      "id": "uuid",
      "status": "rejected",
      // ... other fields
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin, or feedback not accessible
- `404 NOT_FOUND` - Feedback not found
- `400 BAD_REQUEST` - Invalid request data

---

# User Profile

## GET `/api/user/profile`

Returns the current authenticated user's profile with workload metrics.

**Permissions:** All authenticated users

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "_id": "uuid",
      "id": "uuid",
      "auth0_id": "auth0|...",
      "email": "user@example.com",
      "name": "User Name",
      "role": "engineer",
      "account_id": "account-id",
      "team_id": "team-id",
      "specialization": "Backend",
      "vacationDates": [
        {
          "start": "2024-12-20",
          "end": "2024-12-31"
        }
      ],
      "currentTicketCount": 5,
      "currentStoryPointCount": 25,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Workload Metrics:**
- `currentTicketCount` - Number of assigned features (excluding completed)
- `currentStoryPointCount` - Sum of story points for assigned features (excluding completed)

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `500 INTERNAL_ERROR` - Database error

## PATCH `/api/user/profile`

Updates the current user's profile (role, specialization, vacation dates).

**Permissions:** All authenticated users (can update their own profile)

**Request Body:**
```json
{
  "role": "engineer",
  "specialization": "Backend",
  "vacationDates": [
    {
      "start": "2024-12-20",
      "end": "2024-12-31"
    }
  ]
}
```

**Validation:**
- `role` (optional) - One of: `admin`, `pm`, `engineer`, `viewer`
- `specialization` (optional) - One of: `Backend`, `Frontend`, `QA`, `DevOps`, or `null`
- `vacationDates` (optional) - Array of `{start: string, end: string}` or `null`

**Rules:**
- Specialization is only valid for engineers
- Switching role away from engineer clears specialization
- Vacation dates must be valid ISO date strings
- Start date must be before or equal to end date

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "_id": "uuid",
      "id": "uuid",
      "role": "engineer",
      "specialization": "Backend",
      "vacationDates": [
        {
          "start": "2024-12-20",
          "end": "2024-12-31"
        }
      ],
      // ... other fields
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `400 BAD_REQUEST` - Invalid request data (invalid role, specialization, or dates)

---

# Team

## GET `/api/team/members`

Returns all users in the same account with their roles, specializations, workload, and vacation status.

**Permissions:** All authenticated users

**Response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "_id": "uuid",
        "id": "uuid",
        "email": "user@example.com",
        "name": "User Name",
        "role": "engineer",
        "specialization": "Backend",
        "vacationDates": [
          {
            "start": "2024-12-20",
            "end": "2024-12-31"
          }
        ],
        "currentTicketCount": 5,
        "currentStoryPointCount": 25,
        "isOnVacation": false,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

**Fields:**
- `isOnVacation` - `true` if user is currently on vacation (today is within any vacation date range)
- `currentTicketCount` - Number of assigned features (excluding completed)
- `currentStoryPointCount` - Sum of story points for assigned features (excluding completed)

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `500 INTERNAL_ERROR` - Database error

## GET `/api/team/members/available`

Returns all users in the same account, excluding those currently on vacation.

**Permissions:** All authenticated users

**Query Parameters:** None

**Response:**
Same format as `/api/team/members`, but only includes users where `isOnVacation` is `false`.

**Use Case:** Useful for assignment suggestions and workload planning when you need to exclude unavailable team members.

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `500 INTERNAL_ERROR` - Database error

---

# Chat (Phase 11: AI-Powered Chatbot)

## POST `/api/chat/generate-tickets`

AI-powered conversational ticket generation. Enables PMs to have an ongoing conversation with AI to generate, modify, and refine tickets interactively.

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "projectId": "uuid",
  "message": "Add authentication feature with OAuth2 support",
  "conversationHistory": [
    {
      "role": "user",
      "content": "I need to add authentication",
      "timestamp": "2024-01-01T00:00:00Z"
    },
    {
      "role": "assistant",
      "content": "I'll help you add authentication. What authentication methods do you need?",
      "timestamp": "2024-01-01T00:00:01Z"
    }
  ]
}
```

**Validation:**
- `projectId` (required) - Valid UUID
- `message` (required) - Non-empty string
- `conversationHistory` (optional) - Array of chat messages with role, content, and timestamp

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "I've generated ticket suggestions for authentication with OAuth2 support.",
    "suggestedTickets": [
      {
        "title": "Implement OAuth2 Authentication",
        "description": "Add OAuth2 authentication with Google and GitHub providers",
        "priority": "high",
        "effortEstimateWeeks": 2,
        "ticketType": "feature",
        "storyPoints": 8,
        "labels": ["backend", "security", "authentication"],
        "acceptanceCriteria": "Users can authenticate using Google and GitHub OAuth2",
        "dependsOn": [],
        "assignedTo": "user-uuid",
        "confidenceScore": 85
      }
    ],
    "confidenceScores": [85]
  }
}
```

**Features:**
- Understands conversational commands like "add auth to sprint 2", "change priority of ticket 3"
- References existing features in the project
- Suggests appropriate assignments based on engineer availability and specialization
- Maintains conversation context through history

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin
- `404 NOT_FOUND` - Project not found
- `400 BAD_REQUEST` - Invalid request data
- `500 INTERNAL_ERROR` - AI generation failed or database error

## POST `/api/chat/apply-tickets`

Bulk create tickets from AI chat suggestions. Creates multiple tickets with AI-suggested assignments in a single operation.

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "projectId": "uuid",
  "tickets": [
    {
      "title": "Implement OAuth2 Authentication",
      "description": "Add OAuth2 authentication with Google and GitHub providers",
      "priority": "high",
      "effortEstimateWeeks": 2,
      "ticketType": "feature",
      "storyPoints": 8,
      "labels": ["backend", "security"],
      "acceptanceCriteria": "Users can authenticate using Google and GitHub OAuth2",
      "dependsOn": [],
      "assignedTo": "user-uuid",
      "confidenceScore": 85
    }
  ]
}
```

**Validation:**
- `projectId` (required) - Valid UUID
- `tickets` (required) - Non-empty array of ticket objects
- Each ticket must have: `title`, `description`, `priority`, `effortEstimateWeeks`
- `dependsOn` must reference existing feature IDs in the project
- `assignedTo` must reference a valid user in the same account

**Response:**
```json
{
  "success": true,
  "data": {
    "createdTicketIds": ["uuid1", "uuid2"],
    "message": "Successfully created 2 ticket(s)"
  }
}
```

**Features:**
- Bulk creates multiple tickets in a single operation
- Automatically suggests assignments if not provided (using AI assignment suggestions)
- Validates dependencies against existing features
- Enforces account isolation for all operations

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin
- `404 NOT_FOUND` - Project not found
- `400 BAD_REQUEST` - Invalid request data (invalid dependencies, missing fields)
- `500 INTERNAL_ERROR` - Database error or assignment suggestion failed

---

# Type Definitions

## ProjectResponse

```typescript
{
  _id: string
  id: string
  name: string
  description: string
  roadmap: {
    summary: string
    riskLevel: 'low' | 'medium' | 'high'
  }
  createdAt: string
  createdBy?: {
    name: string
    email: string
  } | null
  team_id?: string
}
```

## FeatureResponse

```typescript
{
  _id: string
  id: string
  projectId: string
  title: string
  description: string
  status: 'not_started' | 'in_progress' | 'blocked' | 'complete'
  priority: 'critical' | 'high' | 'medium' | 'low'
  effortEstimateWeeks: number
  dependsOn: string[]
  createdAt: string
  // Jira-style fields
  assignedTo?: string | null
  reporter?: string | null
  storyPoints?: number | null
  labels?: string[]
  acceptanceCriteria?: string | null
  ticketType?: 'feature' | 'bug' | 'epic' | 'story'
  // Timeline fields
  startDate?: string | null
  endDate?: string | null
  duration?: number | null
  isOnCriticalPath?: boolean
  slackDays?: number
}
```

## FeedbackResponse

```typescript
{
  _id: string
  id: string
  projectId: string
  featureId: string
  userId: {
    name: string
    email: string
  } | null
  type: 'comment' | 'timeline_proposal'
  content: string
  proposedRoadmap?: any
  aiAnalysis?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}
```

## UserProfileResponse

```typescript
{
  _id: string
  id: string
  auth0_id: string
  email: string
  name: string
  role: 'admin' | 'pm' | 'engineer' | 'viewer'
  account_id: string
  team_id?: string
  specialization?: 'Backend' | 'Frontend' | 'QA' | 'DevOps' | null
  vacationDates?: Array<{ start: string; end: string }>
  currentTicketCount?: number
  currentStoryPointCount?: number
  createdAt: string
}
```

## TeamMemberResponse

Same as `UserProfileResponse` but includes:
- `isOnVacation: boolean` - Whether user is currently on vacation

## ChatMessage (Phase 11)

```typescript
{
  role: 'user' | 'assistant'
  content: string
  timestamp: string // ISO date string
}
```

## SuggestedTicket (Phase 11)

```typescript
{
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  effortEstimateWeeks: number
  ticketType?: 'feature' | 'bug' | 'epic' | 'story'
  storyPoints?: number | null
  labels?: string[]
  acceptanceCriteria?: string | null
  dependsOn?: string[] // Array of existing feature IDs
  assignedTo?: string | null // User ID (AI-suggested)
  confidenceScore?: number // 0-100
}
```

## GenerateTicketsResponse (Phase 11)

```typescript
{
  message: string // AI's conversational response
  suggestedTickets: SuggestedTicket[]
  confidenceScores?: number[]
}
```

## ApplyTicketsResponse (Phase 11)

```typescript
{
  createdTicketIds: string[]
  message: string
}
```

---

# Rate Limiting

Currently, there are no rate limits enforced. However, AI endpoints (roadmap generation, assignment suggestions) are subject to Google Gemini API rate limits.

# Real-time Events

The application uses Supabase Realtime for live updates. When data changes in the database, connected clients automatically receive updates via WebSocket subscriptions. No additional API calls are needed for real-time updates.

**Subscribed Tables:**
- `projects` - Project list updates
- `features` - Feature status/assignment changes
- `feedback` - New feedback and status changes

