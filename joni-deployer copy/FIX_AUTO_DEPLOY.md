# Fix: Prevent Auto-Deployment on Server Start

## Problem
When you start the backend server (`npm start`), it immediately starts a deployment because:
1. Browser has frontend open on DeploymentProgress screen
2. DeploymentProgress component auto-connects to `/api/deploy` on mount
3. This triggers the deployment script

## Quick Fix (Temporary)

**Before starting the server:**
1. Close ALL browser tabs with `localhost:3000` open
2. OR refresh the page after server is running to reset to landing screen

## Proper Fix (Permanent)

Update DeploymentProgress to NOT auto-connect on mount. Instead, trigger connection manually.

Would you like me to implement the proper fix?
