# API Documentation

This document describes all API endpoints for the AI Roadmap Dashboard.

## Base URL

All API endpoints are prefixed with `/api`.

## Authentication

All endpoints require authentication via Auth0. The session is managed through cookies.

## Response Format

All API responses follow this format:

```typescript
{
  success: boolean
  data?: T
  error?: string
  code?: string
}
```

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Projects

### Get All Projects

**GET** `/api/projects`

Returns a list of all projects the user has access to.

**Response:**
```typescript
{
  success: true,
  data: {
    projects: ProjectResponse[]
  }
}
```

**Example:**
```bash
GET /api/projects
```

---

### Get Project by ID

**GET** `/api/project/:id`

Returns a project with its features and feedback.

**Parameters:**
- `id` (path) - Project UUID

**Response:**
```typescript
{
  success: true,
  data: {
    project: ProjectResponse
    features: FeatureResponse[]
    feedbackByFeature: Record<string, FeedbackResponse[]>
  }
}
```

**Example:**
```bash
GET /api/project/123e4567-e89b-12d3-a456-426614174000
```

---

## Roadmap

### Generate Roadmap

**POST** `/api/roadmap/generate`

Generates a roadmap for a new project using AI.

**Request Body:**
```typescript
{
  projectName: string
  projectDescription: string
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    project: ProjectResponse
    features: FeatureResponse[]
  }
}
```

**Example:**
```bash
POST /api/roadmap/generate
Content-Type: application/json

{
  "projectName": "My New Project",
  "projectDescription": "A description of the project"
}
```

---

## Features

### Update Feature

**PATCH** `/api/feature/:id`

Updates a feature's properties.

**Parameters:**
- `id` (path) - Feature UUID

**Request Body:**
```typescript
{
  status?: string
  priority?: string
  title?: string
  description?: string
  effortEstimateWeeks?: number
  dependsOn?: string[]
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    feature: FeatureResponse
  }
}
```

**Example:**
```bash
PATCH /api/feature/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "status": "active",
  "priority": "P0"
}
```

---

## Feedback

### Create Feedback

**POST** `/api/feedback/create`

Creates a new feedback entry (comment or proposal) for a feature.

**Request Body:**
```typescript
{
  projectId: string
  featureId: string
  type: 'comment' | 'timeline_proposal'
  content: string
  proposedRoadmap?: any
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    feedback: FeedbackResponse
  }
}
```

**Example:**
```bash
POST /api/feedback/create
Content-Type: application/json

{
  "projectId": "123e4567-e89b-12d3-a456-426614174000",
  "featureId": "223e4567-e89b-12d3-a456-426614174000",
  "type": "comment",
  "content": "This feature needs more work"
}
```

---

### Approve Feedback

**POST** `/api/feedback/approve`

Approves a feedback proposal. Only PMs and admins can approve proposals.

**Request Body:**
```typescript
{
  feedbackId: string
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    message: string
    feedback: FeedbackResponse
  }
}
```

**Example:**
```bash
POST /api/feedback/approve
Content-Type: application/json

{
  "feedbackId": "323e4567-e89b-12d3-a456-426614174000"
}
```

---

### Reject Feedback

**POST** `/api/feedback/reject`

Rejects a feedback proposal. Only PMs and admins can reject proposals.

**Request Body:**
```typescript
{
  feedbackId: string
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    message: string
    feedback: FeedbackResponse
  }
}
```

**Example:**
```bash
POST /api/feedback/reject
Content-Type: application/json

{
  "feedbackId": "323e4567-e89b-12d3-a456-426614174000"
}
```

---

## Type Definitions

### ProjectResponse

```typescript
interface ProjectResponse {
  _id: string
  id: string
  name: string
  description: string
  roadmap: {
    summary: string
    riskLevel: string
  }
  createdAt: string
  createdBy?: {
    _id: string
    name: string
    email: string
  } | null
  created_by?: string
  team_id?: string
}
```

### FeatureResponse

```typescript
interface FeatureResponse {
  _id: string
  id: string
  projectId: string
  title: string
  description: string
  status: string
  priority: string
  effortEstimateWeeks: number
  dependsOn: string[]
  createdAt: string
}
```

### FeedbackResponse

```typescript
interface FeedbackResponse {
  _id: string
  id: string
  projectId: string
  featureId: string
  userId: {
    _id: string
    name: string
    email: string
  } | null
  type: string
  content: string
  proposedRoadmap?: any
  aiAnalysis?: string
  status: string
  createdAt: string
}
```

---

## Permissions

### Roles

- `admin` - Full access to all projects
- `pm` - Can create projects and approve/reject proposals
- `engineer` - Can create feedback and proposals
- `viewer` - Read-only access

### Access Control

- Users can only access projects they created or are part of the team
- Only PMs and admins can approve/reject proposals
- All authenticated users can create feedback

---

## Error Handling

All errors are returned in the standard response format:

```typescript
{
  success: false,
  error: string
  code?: string
}
```

Common error codes:
- `UNAUTHORIZED` - User is not authenticated
- `FORBIDDEN` - User does not have permission
- `NOT_FOUND` - Resource not found
- `BAD_REQUEST` - Invalid request data
- `INTERNAL_ERROR` - Server error

