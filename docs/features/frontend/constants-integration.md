# Constants Integration - Frontend Feature

## Overview
Frontend components are ready to use constants from `/lib/constants.ts` once created by the backend team.

## Status
⏳ Pending Backend Implementation

## Current State
The `/lib/constants.ts` file is owned by the backend team and is currently not present in the codebase. Frontend components are using direct string values for:
- Feature statuses: `'backlog' | 'active' | 'blocked' | 'complete'`
- Priorities: `'P0' | 'P1' | 'P2'`
- Feedback types: `'comment' | 'proposal'`
- Feedback statuses: `'pending' | 'approved' | 'rejected'`
- Risk levels: `'low' | 'medium' | 'high'`
- User roles: `'admin' | 'pm' | 'engineer' | 'viewer'`

## Expected Constants Structure
According to the architecture document, constants should be structured as:
```typescript
export const ROLES = { ADMIN: 'admin', PM: 'pm', ENGINEER: 'engineer', VIEWER: 'viewer' } as const
export const FEATURE_STATUS = { NOT_STARTED: 'not_started', IN_PROGRESS: 'in_progress', BLOCKED: 'blocked', COMPLETE: 'complete' } as const
export const PRIORITY_LEVELS = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low' } as const
export const FEEDBACK_STATUS = { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected', DISCUSSION: 'discussion' } as const
export const FEEDBACK_TYPE = { COMMENT: 'comment', TIMELINE_PROPOSAL: 'timeline_proposal' } as const
```

## Migration Plan
Once `/lib/constants.ts` is created by the backend:
1. Update all components to import constants
2. Replace magic strings with constant references
3. Update type definitions to use constant types
4. Ensure type safety is maintained

## Files That Need Updates
- `components/dashboard/ProjectCard.tsx` - Risk level colors
- `components/project/FeatureCard.tsx` - Priority colors
- `components/project/FeatureModal.tsx` - Priority colors, status checks
- `components/project/ProjectDetailClient.tsx` - Status columns, risk levels
- `components/feedback/FeedbackThread.tsx` - Status checks
- `hooks/useFeature.ts` - Status and priority types
- `hooks/useFeedback.ts` - Feedback types and statuses

## Coordination Required
⚠️ **Backend Team**: Please create `/lib/constants.ts` according to the architecture document to enable constants usage in frontend components.

## Status
⏳ Waiting for backend implementation

