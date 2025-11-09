# Backend Request: Fix Reject Pending Status Changes Bug (Verification Needed)

## Issue
**Priority:** Medium (Verification Needed)  
**Status:** Needs Investigation  
**Blocking:** Potentially - Depends on root cause

## Problem Description

Users are unable to reject pending status changes. This could be a frontend issue, backend issue, or both. Backend needs to verify that the rejection endpoint is working correctly.

## Backend Verification Required

### 1. Verify API Endpoint

Check that `/api/feature/:id/reject-status-change` endpoint is:
- ✅ Correctly implemented
- ✅ Handling all error cases
- ✅ Returning proper responses
- ✅ Validating input correctly
- ✅ Enforcing permissions correctly

### 2. Check for Potential Issues

**Issue 1: ID Validation**
- Verify that `pendingChangeId` is being validated correctly
- Check that `featureId` from URL params matches the pending change's feature_id
- Ensure account isolation is enforced

**Issue 2: Status Check**
- Verify that the pending change status is checked correctly
- Ensure that only "pending" status changes can be rejected
- Check that already-processed changes are rejected with proper error

**Issue 3: Database Update**
- Verify that the database update is working correctly
- Check that `rejection_reason` is being stored when provided
- Ensure that status is updated to "rejected"

**Issue 4: Error Handling**
- Verify that all error cases are handled
- Check that error messages are clear and actionable
- Ensure that errors are returned in the correct format

### 3. Test API Endpoint Directly

Test the endpoint with various scenarios:

1. **Valid Rejection:**
   ```bash
   POST /api/feature/{featureId}/reject-status-change
   {
     "pendingChangeId": "valid-uuid",
     "reason": "Optional reason"
   }
   ```
   Expected: 200 OK with success response

2. **Rejection without Reason:**
   ```bash
   POST /api/feature/{featureId}/reject-status-change
   {
     "pendingChangeId": "valid-uuid"
   }
   ```
   Expected: 200 OK with success response

3. **Invalid Pending Change ID:**
   ```bash
   POST /api/feature/{featureId}/reject-status-change
   {
     "pendingChangeId": "invalid-uuid"
   }
   ```
   Expected: 404 NOT_FOUND

4. **Already Processed Change:**
   ```bash
   POST /api/feature/{featureId}/reject-status-change
   {
     "pendingChangeId": "already-processed-uuid"
   }
   ```
   Expected: 400 BAD_REQUEST with message "Pending change has already been processed"

5. **Permission Denied:**
   - Test with non-PM/Admin user
   - Expected: 403 FORBIDDEN

6. **Wrong Feature ID:**
   ```bash
   POST /api/feature/{wrongFeatureId}/reject-status-change
   {
     "pendingChangeId": "valid-uuid-but-wrong-feature"
   }
   ```
   Expected: 400 BAD_REQUEST with message "Pending change does not belong to this feature"

## Files to Review

1. **`/app/api/feature/[id]/reject-status-change/route.ts`**
   - Verify implementation is correct
   - Check error handling
   - Verify response format

2. **`/lib/api/validation.ts`**
   - Verify UUID validation
   - Check required field validation

3. **`/lib/api/permissions.ts`**
   - Verify `requirePMOrAdmin` function
   - Check `requireProjectAccess` function

4. **`/lib/constants.ts`**
   - Verify `PENDING_CHANGE_STATUS` constants
   - Check that status values match database

## Potential Backend Issues

### Issue 1: Missing Account Isolation

Check that account isolation is enforced in the query:
```ts
.eq('account_id', user.account_id)
```

### Issue 2: Status Constant Mismatch

Verify that `PENDING_CHANGE_STATUS.PENDING` matches the database value:
- Database: `'pending'`
- Constant: Should be `'pending'`

### Issue 3: Response Format

Verify that the response matches the expected format:
```ts
{
  success: true,
  data: {
    message: string,
    pendingChange: PendingChangeResponse
  }
}
```

### Issue 4: Error Response Format

Verify that error responses match the expected format:
```ts
{
  success: false,
  error: string,
  code: string
}
```

## Testing Checklist

- [ ] Test valid rejection (with reason)
- [ ] Test valid rejection (without reason)
- [ ] Test invalid pending change ID
- [ ] Test already processed change
- [ ] Test permission denied (non-PM/Admin)
- [ ] Test wrong feature ID
- [ ] Test account isolation
- [ ] Test database update
- [ ] Test response format
- [ ] Test error responses

## Expected Behavior

**Success Response:**
```json
{
  "success": true,
  "data": {
    "message": "Status change rejected: Optional reason",
    "pendingChange": {
      "_id": "uuid",
      "id": "uuid",
      "featureId": "uuid",
      "proposedBy": {
        "_id": "user-uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "fromStatus": "not_started",
      "toStatus": "in_progress",
      "status": "rejected",
      "rejectionReason": "Optional reason",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
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

## Related Documentation

- Phase 12 Backend: `/docs/features/backend/phase12-drag-and-drop.md`
- API Documentation: `/docs/api.md` (Reject Status Change endpoint)
- Frontend Request: `/docs/coordination/frontend-request-fix-reject-pending-changes.md`

## Completion Criteria

- [ ] API endpoint tested and verified working
- [ ] All error cases handled correctly
- [ ] Response format matches expected format
- [ ] Account isolation enforced
- [ ] Permissions enforced
- [ ] Database updates working correctly
- [ ] Error messages are clear and actionable

## Timeline

**Estimated Time:** 30-60 minutes (testing and verification)  
**Priority:** Medium (verification needed to rule out backend issues)

---

**Requested By:** Debugger Agent  
**Date:** 2024  
**Related Issue:** Unable to reject pending status changes  
**Note:** This is a verification request. The issue is likely frontend-related, but backend should verify the API is working correctly.

