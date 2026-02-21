# Performance Verification Plan: MemberList Redundant Fetching

## Goal
Verify the removal of redundant data fetching and real-time subscription in `components/MemberList.tsx`.

## Issue Description
The `MemberList` component was fetching members data and subscribing to changes independently, even though its parent component (`GroupPage`) already performed the same fetch and subscription. This resulted in:
1.  Double network requests for `members` table on page load.
2.  Double WebSocket subscriptions for `members` changes.
3.  Redundant state management and re-renders.

## Verification Steps (Manual)

### 1. Network Requests
**Before Optimization:**
1.  Open the application in a browser.
2.  Open Developer Tools -> Network tab.
3.  Navigate to a group page (e.g., `/group/[slug]`).
4.  Filter for `members`.
5.  Observe **two** identical GET requests to the `members` table endpoint (Supabase REST API).

**After Optimization:**
1.  Repeat steps 1-4.
2.  Observe **one** GET request to the `members` table endpoint.

### 2. Real-time Subscriptions
**Before Optimization:**
1.  Open Developer Tools -> Network tab -> WS (WebSocket).
2.  Inspect the WebSocket frames for Supabase Realtime.
3.  Observe subscription messages for `members` channel from both `GroupPage` and `MemberList`.

**After Optimization:**
1.  Repeat steps 1-2.
2.  Observe only **one** subscription message for `members` channel (initiated by `GroupPage`).

### 3. Visual Regression
1.  Ensure the member list renders correctly with member avatars, names, and status.
2.  Ensure "No members yet" state is handled correctly.
3.  Ensure updates (e.g., joining, leaving, status change) are reflected immediately (via prop updates from parent).

## Expected Outcome
- Reduced network traffic.
- Reduced client-side processing (rendering, state updates).
- Cleaner code architecture (single source of truth).
