# Frontend Request: Fix Drag-and-Drop Click Conflict

## Issue
**Priority:** High  
**Blocking:** Yes - Users cannot click tickets to edit them after drag-and-drop is implemented  
**Status:** Needs Immediate Fix

## Problem Description

Currently, tickets in the Kanban board cannot be clicked to open the edit modal because the drag-and-drop handlers are intercepting all pointer events. The `PointerSensor` in `ProjectDetailClient.tsx` activates immediately on pointer down, preventing click events from reaching the `FeatureCard` component.

**Expected Behavior:**
- Users should be able to click a ticket to open the edit modal
- Users should be able to drag tickets between status columns
- Both interactions should work seamlessly

**Current Behavior:**
- Click events are blocked by drag handlers
- Only drag functionality works
- Users cannot edit tickets via click

## Root Cause

In `/components/project/ProjectDetailClient.tsx` (line 225), the `PointerSensor` is created without an `activationDistance`:

```ts
const sensors = useSensors(
  useSensor(PointerSensor),  // ❌ No activation distance
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
)
```

This causes the drag sensor to activate immediately on pointer down, preventing click events from firing.

## Solution

Add an `activationDistance` to the `PointerSensor` to require a minimum drag distance before activating drag mode. This allows clicks to work normally while preserving drag functionality.

**Recommended Implementation:**

```ts
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Activate drag after 8px of movement
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
)
```

**Why This Works:**
- Click events fire immediately (no movement)
- Drag activates after 8px of movement
- Standard pattern used in @dnd-kit documentation
- Maintains accessibility with keyboard sensor

## Files to Modify

1. **`/components/project/ProjectDetailClient.tsx`**
   - Update `PointerSensor` configuration (line 225)
   - Add `activationConstraint` with `distance: 8`

## Testing Requirements

1. **Click Testing:**
   - Click a ticket → Should open FeatureModal
   - Click should work immediately (no delay)
   - Click should work for all tickets (new and existing)

2. **Drag Testing:**
   - Drag a ticket → Should activate after 8px movement
   - Drag should work smoothly between columns
   - Drag should work for all draggable tickets

3. **Edge Cases:**
   - Very small movements (< 8px) should trigger clicks, not drags
   - Rapid clicks should not trigger drag
   - Drag should work on touch devices (if supported)

4. **Permission Testing:**
   - Viewers should be able to click (read-only)
   - Viewers should not be able to drag (disabled in `DraggableFeatureCard`)
   - Engineers/PMs/Admins should be able to both click and drag

## Implementation Notes

- Use `distance: 8` as the activation constraint (standard value)
- Ensure `canEdit` prop correctly disables drag for viewers
- Test on both desktop and mobile devices
- Verify keyboard navigation still works (KeyboardSensor)

## Related Documentation

- @dnd-kit Core: [Sensors Documentation](https://docs.dndkit.com/api-documentation/sensors/pointer-sensor)
- Phase 12 Documentation: `/docs/features/frontend/phase12-drag-and-drop.md`
- API Documentation: `/docs/api.md` (Pending Status Changes endpoints)

## Completion Criteria

- [ ] PointerSensor configured with activationDistance
- [ ] Click events work for all tickets
- [ ] Drag events work after 8px movement
- [ ] All tests pass (click, drag, permissions)
- [ ] No regressions in existing drag-and-drop functionality
- [ ] Code reviewed and approved

## Timeline

**Estimated Time:** 15-30 minutes  
**Priority:** High (blocking user workflow)

---

**Requested By:** Debugger Agent  
**Date:** 2024  
**Related Issue:** Drag-and-drop click conflict

