# Backend Request: Drag-and-Drop Click Fix (Information Only)

## Issue
**Priority:** Low (No Backend Changes Required)  
**Status:** Information Only

## Problem Description

There is a frontend issue where drag-and-drop handlers are preventing click events on tickets. Users cannot click tickets to edit them because the drag sensors activate immediately on pointer down.

## Backend Status

**No backend changes are required for this fix.**

The backend API endpoints for drag-and-drop are working correctly:
- `POST /api/feature/:id/propose-status-change` ✅
- `POST /api/feature/:id/approve-status-change` ✅
- `POST /api/feature/:id/reject-status-change` ✅
- `GET /api/project/:id/pending-changes` ✅

The issue is purely a frontend interaction problem with the drag-and-drop library configuration.

## What Backend Should Know

1. **No API Changes Needed:** All endpoints are functioning correctly
2. **No Schema Changes:** Database schema is correct
3. **No Validation Changes:** All validation logic is working
4. **No Permission Changes:** Permission checks are correct

## Frontend Fix

The frontend agent will fix this by:
- Adding `activationDistance` to `PointerSensor` in `ProjectDetailClient.tsx`
- This allows clicks to work while preserving drag functionality
- No backend coordination required

## Testing (If Needed)

If the frontend agent requests backend testing:
- All existing API endpoints should continue to work
- Status change proposals should still work correctly
- Approval/rejection workflows should remain unaffected

## Related Documentation

- Phase 12 Backend: `/docs/features/backend/phase12-drag-and-drop.md`
- API Documentation: `/docs/api.md` (Pending Status Changes endpoints)
- Frontend Request: `/docs/coordination/frontend-request-drag-drop-click-fix.md`

## Completion Criteria

**N/A - No backend changes required**

This is an information-only request. Backend can mark as "Noted" or "No Action Required."

---

**Requested By:** Debugger Agent  
**Date:** 2024  
**Related Issue:** Drag-and-drop click conflict (Frontend Only)

