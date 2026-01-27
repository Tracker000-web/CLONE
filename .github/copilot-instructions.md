# Copilot Instructions for Manager Activity Tracker

## Architecture Overview

This is a **hybrid full-stack application** combining a Flask backend with a vanilla JavaScript frontend and optional Node.js/MySQL integration:

- **Frontend**: Single-page application (SPA) in [index.html](../index.html), [script.js](../script.js), [styles.css](../styles.css)
- **Backend**: Flask app ([app.py](../app.py)) with basic authentication endpoints (NOT integrated with models)
- **Database Layer**: Two separate systems—SQLAlchemy models ([models.py](../models.py)) and a Node.js/MySQL service ([server.js](../server.js))
- **Progressive Web App**: Service worker ([sw.js](../sw.js)) for offline caching

**Critical Issue**: The Flask backend (`app.py`) does NOT use the models (`models.py`). The Node.js server has its own MySQL connection, creating **data isolation**. Frontend will attempt to sync with Flask (port 5000) but backend doesn't persist to the SQLAlchemy database.

## Data Flow & Storage Strategy

1. **LocalStorage-First**: All manager/cell data lives in browser localStorage (`managerData`, `dashboardSettings`, `activeManagerId`)
2. **Backend Sync (Admin-Only)**: When an admin edits a cell, `saveCellToBackend()` sends to `/api/save-cell` with `X-Role` header
3. **Session Validation**: `checkSession()` calls `/api/me` to populate `currentUser` and determine admin access
4. **Fallback Pattern**: If backend is offline, operations continue locally (see `addUserToDatabase()` catch block)

## Key Patterns & Developer Workflows

### Frontend State Management
- Global variables at top of [script.js](../script.js#L1-L40): DOM elements and auth state (`isLoggedIn`, `currentUser`, `currentActiveManager`)
- Spreadsheet data structure: `managers = [{id, name, rows, notes, timestamps, logs}]`
- Two-tier visibility: `.admin-only` CSS class elements only show if `currentUser.role === "admin"`

### Spreadsheet Implementation
- Column labels use base-26 conversion (`getColumnLabel()` function) to generate A, B, C... AA format
- Cells are `contentEditable` with `onblur` handlers that trigger `saveData()` and backend sync
- Row data is modified in-place; columns are always 4 initially (`spreadsheetTemplate`)

### Authentication Flow
- No password validation server-side (hardcoded `/api/me` returns admin role)
- "Remember me" checkbox persists email/checkbox state in localStorage
- Signup stores locally or attempts POST to `/add-user` (Node.js endpoint, not Flask)
- Password reset generates a token printed to terminal (debug feature)

### Settings & Theme
- `applySettings()` applies theme class (`theme-dark`/`theme-light`) and rebuilds sidebar position
- All UI state changes call `saveSettings()` to persist

## Running the Application

**Frontend**: Open [index.html](../index.html) in browser (static, no build needed)

**Flask Backend** (for auth endpoints):
```bash
pip install -r requirements.txt
python app.py  # Runs on http://127.0.0.1:5000
```

**Node.js MySQL Backend** (optional, for user persistence):
```bash
npm install
node server.js  # Runs on http://localhost:3000
```

Service worker registers automatically on page load (`sw.js`).

## Critical Developer Notes

1. **Hardcoded Credentials in server.js**: MySQL password is exposed. Migrate to environment variables before production.
2. **Role-Based Access**: Only admins see admin-only UI and can sync cells to backend. Modify role check in `checkSession()` if adding new roles.
3. **Cell Sync Limitation**: `saveCellToBackend()` requires `currentUser` to exist; if session check fails, cells don't sync.
4. **Models.py Unused**: SQLAlchemy models exist but are not instantiated. If implementing backend persistence, integrate `db.init_app(app)` in Flask and update the save endpoints.
5. **CORS Enabled**: Both backends allow cross-origin requests for frontend access.
6. **LocalStorage Quota**: No size limits checked; localStorage could fill with manager/log data over time.

## Testing & Debugging

- Browser DevTools: Check Application > LocalStorage for `managerData` and `dashboardSettings`
- Terminal Output: Password reset tokens print to Flask console
- Admin Features: Toggle "admin" role in browser console: `currentUser.role = "admin"; location.reload();`
- Service Worker: Inspect Registered in DevTools > Application > Service Workers
