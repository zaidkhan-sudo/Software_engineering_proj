# PHASES.md — Build Plan for the Public Grievance Tracking System

This file is the **step-by-step build plan**. `README.md` is the **source of truth** for *what* the system is (architecture, schema, API, security, folder structure). This file says **in what order and how** to build it.

---

## 0. Rules for the AI (read before doing anything)

1. **Work one phase at a time.** Never start a phase until the user types `proceed` (or `proceed phase N`).
2. **At the start of every phase:**
   a. Re-read the README sections listed under "README sections to re-read" for that phase.
   b. Print a short plan: the files you will create or edit.
   c. If the README and this file conflict, or something is ambiguous, **stop and ask**. Do not guess.
3. **At the end of every phase:**
   a. Run the phase's **Verification** steps yourself where possible (start the server, call endpoints with `curl`, run tests). Show the real output. Do not claim something works without running it.
   b. Print the **Phase Report** (template at the bottom).
   c. Tick the phase in the **Progress Tracker** below.
   d. **STOP and wait** for the user.
4. **Stay inside the README.** Do not add libraries, endpoints, fields, or features that are not in the README. Do not remove anything the README requires. If you believe something should change, propose it and wait for approval.
5. **The user is a student learning by doing.** After each phase give a short "What you just built and why" explanation (5–10 lines), and tell the user exactly how to test it manually (Postman or curl). When the user reports a bug, **explain the cause first**, then fix it with the smallest change. Do not silently rewrite whole files.
6. **Folder structure must match the README exactly** (server/, client/, desktop/, docs/). Create files in the places the README shows.
7. **Never commit secrets.** `.env` is git-ignored; `.env.example` has placeholders only.
8. **Keep code simple and readable.** Plain JavaScript (no TypeScript). Short comments on non-obvious logic. No clever abstractions.

### Decision flag (default, change only if the user says so)
- **Status workflow:** implement exactly what the README defines (`SUBMITTED → UNDER_REVIEW → IN_PROGRESS → RESOLVED/REJECTED`, `RESOLVED/REJECTED → REOPENED → UNDER_REVIEW`). `SUBMITTED → REJECTED` is **not** allowed unless the user asks.

---

## 1. Global Conventions (apply in every phase)

### Tech and versions
- Node.js 20+, Express, Mongoose, **CommonJS** (`require`) on the server. Client uses ES modules (Vite default).
- Server packages: `express mongoose dotenv cors helmet express-rate-limit express-mongo-sanitize bcryptjs jsonwebtoken joi multer socket.io node-cron` and dev: `nodemon jest supertest`.
- Use `bcryptjs` (pure JS) so Render builds never fail on native modules. Salt rounds: 10.

### Server code conventions
- **Response helpers** in `utils/apiResponse.js`: `success(res, data, message, statusCode = 200, pagination)` and `fail(res, statusCode, code, message, details)`. Output must match the README "Standard Response Format" exactly.
- **Error handling:** create an `AppError(statusCode, code, message, details)` class in `utils/AppError.js`. Controllers `throw new AppError(...)`. Wrap async controllers with a small `asyncHandler` util so errors reach `middleware/errorHandler.js`. The error handler also maps: Mongoose `ValidationError` → 400 `VALIDATION_ERROR`, duplicate key (code 11000) → 409 `DUPLICATE`, invalid `ObjectId` (`CastError`) → 400 `INVALID_ID`, Multer errors → 400 with the messages in README test cases TC-11/12/13, JWT errors → 401. Never leak stack traces when `NODE_ENV=production`.
- **Error codes:** `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `DUPLICATE`, `INVALID_TRANSITION`, `INVALID_ID`, `UPLOAD_ERROR`, `SERVER_ERROR`.
- **JWT payload:** `{ id: user._id, role: user.role }`, signed with `JWT_SECRET`, expiry `JWT_EXPIRE`. Header format: `Authorization: Bearer <token>`. The Socket.IO handshake reads `decoded.id` (README).
- **`req.user`:** the auth middleware loads the user from the DB (without `passwordHash`), rejects missing users and `isActive === false` (401 "Account deactivated"), and sets `req.user`.
- **Pagination helper:** query `page` (default 1), `limit` (default 10, max 50). Return the `pagination` object from the README.
- **Not-found-vs-forbidden rule:** when a user requests a grievance they are not allowed to see, return **404** (do not reveal it exists).
- **Constants** in `utils/constants.js`: `ROLES`, `STATUSES`, `PRIORITIES` (`low|medium|high|urgent`), `VALID_TRANSITIONS` (exactly as in README).
- **Env variables:** `PORT, NODE_ENV, MONGO_URI, MONGO_URI_TEST, JWT_SECRET, JWT_EXPIRE, CORS_ORIGINS, ESCALATION_DAYS, CRON_SECRET`. Load with `dotenv` in `server.js`. Fail fast with a clear message if `MONGO_URI` or `JWT_SECRET` is missing.

### Client code conventions
- React + Vite (JS), **Tailwind v4** via `@tailwindcss/vite` and `@import "tailwindcss";` (no `tailwind.config.js`), `react-router-dom` v6 with **`HashRouter`**, Axios, `socket.io-client`. Optional: `recharts` for admin charts (allowed; analytics needs charts).
- Token stored in `localStorage` under key `token`; user object under `user`.
- All API calls go through `src/services/api.js`.
- Every page handles three states: loading, error, empty.

---

## 2. Progress Tracker (the AI updates this)

- [x] Phase 0 — Project setup and docs skeleton
- [x] Phase 1 — Backend skeleton
- [x] Phase 2 — Auth, core models, seed
- [x] Phase 3 — Departments, Users, Categories
- [x] Phase 4 — Grievance filing and reading
- [x] Phase 5 — Status workflow, assignment, comments, feedback, reopen
- [x] Phase 6 — Notifications and Socket.IO
- [x] Phase 7 — Analytics, audit log, escalation
- [ ] Phase 8 — Backend tests and hardening
- [ ] Phase 9 — Client foundation
- [ ] Phase 10 — Citizen pages
- [ ] Phase 11 — Officer pages
- [ ] Phase 12 — Admin pages
- [ ] Phase 13 — Real-time notifications in the UI
- [ ] Phase 14 — Electron desktop shell
- [ ] Phase 15 — Deployment and installers
- [ ] Phase 16 — Final documentation and polish

---

## Phase 0 — Project Setup and Docs Skeleton

**Goal:** an empty but correctly structured repo, tools verified, docs folder started.

**README sections to re-read:** Folder Structure, Setup & Run, Tech Stack.

**Tasks**
1. Create the monorepo root `grievance-system/` with `server/`, `client/`, `desktop/`, `docs/` (match the README tree; empty subfolders may hold a `.gitkeep`).
2. Create root `.gitignore`: `node_modules/`, `.env`, `.env.*` (except `.env.example`), `dist/`, `release/`, `coverage/`, `.DS_Store`.
3. `git init`, first commit "Phase 0: project skeleton". (The user will add the remote.)
4. Verify tools: `node -v` (must be 20+), `npm -v`, `git --version`. Report results.
5. Ask the user for their **MongoDB Atlas** connection string (one DB for dev, and optionally a second DB name for tests). Explain: Atlas → Database Access (user) → Network Access (`0.0.0.0/0`) → Connect → Drivers. Do not proceed to Phase 1 until the user confirms they have it. Never write the real string into any committed file.
6. Create docs skeleton files with headings only (to be filled in Phase 16): `docs/SRS.md` (sections: Introduction, Overall Description, Functional Requirements, Non-Functional Requirements, Use Cases, Constraints), `docs/test-plan.md`, `docs/risk-analysis.md`.

**Verification:** `tree -L 2` (or equivalent) shows the structure; `git log` shows the first commit.

---

## Phase 1 — Backend Skeleton

**Goal:** a running Express server connected to MongoDB with security middleware, error handling and `/health`.

**README sections to re-read:** Architecture, Tech Stack, API Endpoints (Health Check, Standard Response Format), Security (Helmet, CORS, Trust Proxy, Sanitization), Folder Structure (server/).

**Tasks (in `server/`)**
1. `npm init -y`, install packages (see Global Conventions). Scripts: `"dev": "nodemon server.js"`, `"start": "node server.js"`, `"test": "jest --runInBand"`, `"test:coverage": "jest --runInBand --coverage"`, `"seed": "node seed.js"`.
2. `.env.example` with every variable (placeholders). Create the real `.env` locally with the user's values.
3. `config/db.js`: `connectDB()` using `MONGO_URI`, logs success, exits on failure.
4. `utils/constants.js`, `utils/apiResponse.js`, `utils/AppError.js`, `utils/asyncHandler.js`.
5. `middleware/errorHandler.js` (see conventions) plus a 404 handler for unknown routes (returns `NOT_FOUND`).
6. `app.js`:
   - `app.set('trust proxy', 1)`
   - `helmet()`, `express.json({ limit: '1mb' })`, `express.urlencoded({ extended: true })`
   - `express-mongo-sanitize`
   - CORS with the **exact** logic from README Security (allows no-origin, `'null'`, `'file://'` / startsWith `file://`, and `CORS_ORIGINS` entries)
   - `GET /health` (root, not under `/api/v1`) → `{ status: "ok", timestamp }`
   - mounts `/api/v1` router (empty for now), then 404 and error handlers
   - Exports `app` (so tests can import it without starting a server).
7. `server.js`: load env, `connectDB()`, create `http.createServer(app)`, listen on `PORT`. (Socket.IO is added in Phase 6; leave a clearly marked place for it.)
8. `routes/healthRoutes.js` is mounted at root.

**Verification**
- `npm run dev` starts, shows "MongoDB connected".
- `curl http://localhost:5000/health` returns ok JSON.
- `curl http://localhost:5000/nope` returns the standard error JSON with `NOT_FOUND`.
- Stop MongoDB access (wrong URI) once to confirm the clear failure message, then restore.

---

## Phase 2 — Auth, Core Models, Seed

**Goal:** register, login, profile; role-based middleware; core models; a seed script.

**README sections to re-read:** Database Schema (User, Department, Counter, indexes), API Endpoints (Authentication, Access Control Rules), Security (bcrypt, JWT, Active User Check, Rate Limiting), Setup & Run (Seed Data), Testing (TC-01 to TC-04).

**Tasks**
1. Models:
   - `models/User.js`: `name, email (unique, lowercase, trim), passwordHash, role (citizen|officer|admin, default citizen), department (ref Department, required only when role is officer), phone, isActive (default true), createdAt`. Add `comparePassword(plain)` method. Never return `passwordHash` in JSON (`toJSON` transform).
   - `models/Department.js`: `name (unique), description, categoriesHandled [String], isActive (default true)`.
   - `models/Counter.js`: `_id: String, seq: Number`.
2. `middleware/auth.js` (verify JWT → load user → reject inactive), `middleware/authorize.js` (`authorize('admin','officer')`), `middleware/validate.js` (runs a Joi schema on `req.body`; returns `VALIDATION_ERROR` with a `details` array of `{ field, message }`).
3. `validations/authValidation.js`: register (`name` 2–60, `email`, `password` min 8, optional `phone`), login, profile update (all optional: `name`, `phone`, `password`).
4. `middleware/rateLimiter.js`: 20 requests / 15 minutes, applied **only** to `POST /auth/login` and `POST /auth/register`; `skip` when `NODE_ENV === 'development'`.
5. `controllers/authController.js` and `routes/authRoutes.js`:
   - `POST /auth/register`: always creates role `citizen` (ignore any role in the body). 201 with `{ user, token }`. Duplicate email → 409 "Email already registered".
   - `POST /auth/login`: wrong email or password → 401 "Invalid credentials" (same message for both). Deactivated → 401 "Account deactivated". Returns `{ user, token }`.
   - `GET /auth/me` and `PATCH /auth/me` (name, phone, password; hash new password; never allow changing email or role here).
6. `routes/index.js`: mount all `/api/v1` routers (add new ones in later phases).
7. `seed.js` (**refuses to run when `NODE_ENV === 'production'`**): wipes dev collections it owns, then creates:
   - Admin `admin@grievance.local` / `admin123`
   - Departments with categories: *Roads & Infrastructure* (Roads, Streetlights), *Water Supply* (Water Supply, Drainage), *Sanitation* (Garbage, Sanitation), *Electricity* (Electricity)
   - One officer per department (`officer.roads@grievance.local`, etc., password `officer123`)
   - Two citizens (`citizen1@grievance.local`, `citizen2@grievance.local`, password `citizen123`)
   - (Sample grievances are added to the seed in Phase 5, once the model exists.)
8. Unique index on `User.email` (README Indexes table).

**Verification (curl/Postman, show outputs)**
- TC-01 register ok, TC-02 duplicate email 409, TC-03 wrong password 401, TC-04 deactivated user 401 (deactivate one in the DB shell to test).
- `GET /auth/me` with and without a token.
- Sending `"role":"admin"` in register still creates a citizen.
- `npm run seed` works twice in a row (idempotent) and logs the created accounts.

---

## Phase 3 — Departments, Users (Admin), Categories

**Goal:** admin management endpoints and the categories dropdown source.

**README sections to re-read:** API Endpoints (Categories, Departments, Users), Database Schema (User.isActive, Department), Access Control Rules.

**Tasks**
1. `controllers/departmentController.js`, `routes/departmentRoutes.js` (all admin-only): `GET /departments`, `POST`, `PATCH /:id`, `DELETE /:id` (**soft delete**: set `isActive: false`; refuse with 400 if active officers still belong to it? — **No**: just deactivate and return it; keep it simple).
2. `controllers/userController.js`, `routes/userRoutes.js` (admin-only): `GET /users` (filter by `role`, paginated, `?search=` on name/email), `POST /users` (create **officer or admin** only; officers require a valid active `department`), `PATCH /users/:id` (name, phone, role, department, `isActive`; never return or accept `passwordHash`), `DELETE /users/:id` (sets `isActive: false`; an admin cannot deactivate themselves).
3. `controllers/categoryController.js`, `routes/categoryRoutes.js`: `GET /categories` (any authenticated user) returns the sorted, de-duplicated list of `categoriesHandled` across **active** departments.
4. `validations/` additions for department and user create/update (Joi).
5. Category names must be unique across departments (enforce on create/update of a department: 409 if a category is already handled by another active department) so that department routing in Phase 4 is unambiguous.

**Verification:** with the seeded admin token: create/update/deactivate a department and an officer; confirm a citizen token gets 403 on `/users` and `/departments` (TC-14 style); confirm `/categories` works for a citizen token; confirm a deactivated user's old JWT is rejected.

---

## Phase 4 — Grievance Filing and Reading

**Goal:** citizens file grievances (with images); role-scoped reading; image streaming.

**README sections to re-read:** Features, Database Schema (Grievance, Attachment Handling, Tracking ID Generation, Indexes), API Endpoints (Grievances, Access Control Rules), Security (File Upload Limits), Testing (TC-05, TC-06, TC-11 to TC-17).

**Tasks**
1. `models/Grievance.js` with every field in the README ER diagram: `trackingId (unique), title, description, category, priority, location, attachments [{ filename, mimeType, size, data: Buffer }], status (default SUBMITTED), citizen, department, assignedOfficer, createdAt, updatedAt, resolvedAt, feedback { rating, comment }, escalated (default false), reopenCount (default 0)`. Add all indexes from the README Indexes table. Use `timestamps: true` for `createdAt/updatedAt`.
2. `models/StatusHistory.js` and `models/Comment.js` (needed now so the detail endpoint can populate them; they are written to in Phase 5). Index StatusHistory on `grievance`.
3. `services/trackingIdService.js`: the **atomic** Counter + `$inc` logic from the README, producing `GRV-YYYY-000001`.
4. `middleware/upload.js`: Multer `memoryStorage`, field name `attachments`, max **2** files, **1 MB** each, only `image/jpeg` and `image/png`. Error messages must match README: "File size exceeds 1 MB limit", "Only JPG and PNG files are allowed", "Maximum 2 attachments allowed" (all 400).
5. `validations/grievanceValidation.js`: `title` 5–200, `description` 10–2000, `category` required, `priority` (default `medium`), `location` 3–300.
6. `controllers/grievanceController.js` + `routes/grievanceRoutes.js`:
   - `POST /grievances` (citizen only; multipart): validate; the `category` must belong to an active department (else 400 "No department handles this category"); set `department` from that mapping; generate `trackingId`; status `SUBMITTED`; create the **initial StatusHistory** entry (`fromStatus: null`, `toStatus: SUBMITTED`, `changedBy: citizen`, remark "Grievance filed"). 201.
   - `GET /grievances` (role-scoped): citizen → own; officer → own department; admin → all. Filters: `status, category, priority, from, to` (date range on `createdAt`), `search` (title or trackingId), `sort` (default newest first), paginated. **Always** `.select('-attachments.data')`.
   - `GET /grievances/:id`: access rules (404 if not allowed); populate `citizen` (name, email), `department` (name), `assignedOfficer` (name); include `statusHistory` (oldest→newest, populate `changedBy` name/role) and `comments` (**filter out `isInternal` comments for citizens**). Never include `attachments.data`.
   - `GET /grievances/track/:trackingId`: same rules as above. **Route order matters:** register `/track/:trackingId` **before** `/:id`.
   - `GET /grievances/:id/attachments/:index`: same access rules; validate index; set `Content-Type` from `mimeType`; send the Buffer.
7. Write one reusable function `canAccessGrievance(user, grievance)` (citizen owns it, officer same department, admin always) and use it everywhere.

**Verification (show outputs)**
- TC-05 file with all fields + 1 image; TC-06 no JWT; TC-11 (>1 MB), TC-12 (.gif), TC-13 (3 files).
- TC-15 citizen B requesting citizen A's grievance → 404.
- TC-16 detail response contains no `data` field in attachments (inspect the JSON).
- TC-17 attachment endpoint returns the image (open it in a browser tab using a token via Postman "Send and Download").
- Officer of Roads cannot see a Water grievance; admin sees all.
- Two grievances created in quick succession get sequential tracking IDs.

---

## Phase 5 — Status Workflow, Assignment, Comments, Feedback, Reopen

**Goal:** the full grievance lifecycle with audit trail.

**README sections to re-read:** Status Workflow (diagram, Transition Rules, Backend Enforcement), API Endpoints (status, assign, comments, feedback, reopen), Access Control Rules, Testing (TC-07 to TC-10).

**Tasks**
1. `PATCH /grievances/:id/status` (officer, admin): body `{ status, remark }`, `remark` **required** (min 3 chars). Officer must be in the grievance's department (else 404); admin any.
   - Validate with `canTransition` from `VALID_TRANSITIONS`; invalid → 400 `INVALID_TRANSITION` "Invalid status transition".
   - A target of `REOPENED` is **never allowed here** (only citizens via `/reopen`).
   - On `SUBMITTED → UNDER_REVIEW`, if no `assignedOfficer`, set it to the acting officer.
   - Set `resolvedAt` when status becomes `RESOLVED`.
   - Create a `StatusHistory` entry (from, to, changedBy, remark). Update the grievance and the history **together** (do both, and if the second fails, surface the error; a MongoDB transaction is not required on the free tier).
   - Call a notification hook `notifyStatusChange(grievance, from, to, remark, actor)`. In this phase it is a **stub** that does nothing (implemented in Phase 6). Keep the call site in place.
2. `PATCH /grievances/:id/assign` (admin): body `{ department?, assignedOfficer? }`. If `assignedOfficer` is given it must be an active officer, and must belong to the grievance's (new) department. Record the change in the audit trail by creating a `StatusHistory` entry with `fromStatus === toStatus` and a remark such as "Reassigned to <dept/officer>".
3. `POST /grievances/:id/comments` (authenticated, must have access): body `{ text, isInternal? }`. `text` 1–1000. `isInternal` is honored **only** for officer/admin; for citizens it is forced to `false`. Return the created comment.
4. `POST /grievances/:id/feedback` (citizen, own grievance): only when status is `RESOLVED`; body `{ rating (1–5), comment? }`; only once (400 if feedback already exists).
5. `POST /grievances/:id/reopen` (citizen, own grievance): allowed from `RESOLVED` or `REJECTED`; body `{ reason }` required; if `reopenCount >= 1` → 403 "Grievance can only be reopened once". Sets `status = REOPENED`, increments `reopenCount`, clears `resolvedAt`, writes StatusHistory (remark = reason) and calls the notification hook.
6. Add to `seed.js`: 8–10 sample grievances across categories and statuses, each with consistent StatusHistory entries (use the real service and transitions, no images).

**Verification (show outputs)**
- TC-07 valid transition creates history; TC-08 `SUBMITTED → RESOLVED` returns 400; TC-09 reopen works; TC-10 second reopen returns 403.
- Officer from another department gets 404 on status update.
- Missing remark → 400. Officer trying `REOPENED` via the status endpoint → 400.
- Internal comment by an officer is **not** returned to the citizen but **is** returned to staff.
- Feedback only after `RESOLVED`; second feedback rejected.

---

## Phase 6 — Notifications and Socket.IO

**Goal:** persistent notifications plus real-time delivery with authenticated sockets.

**README sections to re-read:** Architecture, Security (Socket.IO Auth, CORS and Electron — Socket.IO part), Socket.IO Authentication code, API Endpoints (Notifications), Testing (TC-19), Database Schema (Notification, indexes).

**Tasks**
1. `models/Notification.js` with the compound index `{ user, isRead }`.
2. `services/notificationService.js`:
   - `init(io)` stores the Socket.IO instance.
   - `notifyUser(userId, { message, grievanceId, event, payload })`: creates a Notification document, then emits to room `user:<id>` (event `notification`; for status changes also emit `status-update` with `{ trackingId, newStatus, message }` exactly like the README example).
   - `notifyAdmins(...)`: creates a Notification for every active admin and emits to room `admins`.
   - Must not crash the request if emitting fails (wrap in try/catch and log).
3. Implement `notifyStatusChange` (from Phase 5): notify the **citizen** on every change; notify the **assigned officer** when a citizen reopens or comments (comment notifications: citizen→officer, staff public comment→citizen).
4. `server.js`: create the Socket.IO `Server` with the **same CORS rule** as Express (README code), add the `io.use` JWT handshake middleware with the **`isActive` DB check**, rooms `user:<id>` and `admins` (admins). Store `io` via `notificationService.init(io)`.
5. `controllers/notificationController.js` + routes: `GET /notifications` (own, paginated, newest first, include `unreadCount`), `PATCH /notifications/:id/read` (own only; 404 otherwise), and also `PATCH /notifications/read-all` (marks all own as read; small convenience for the UI).

**Verification**
- Write a tiny script `server/scripts/socket-test.js` (not part of the app) that connects with a citizen JWT, listens for `status-update`, while you change the status with an officer token in Postman. Show the received event (TC-19).
- Connecting without a token or with a deactivated user's token is rejected.
- `GET /notifications` shows the stored notification even if the socket was not connected.

---

## Phase 7 — Analytics, Audit Log, Escalation

**Goal:** the admin reporting endpoints and the auto-escalation job.

**README sections to re-read:** API Endpoints (Analytics, Audit Log, Escalation Job), Features (System), Deployment → Known Limitations, Testing (TC-18), Setup & Run (env: ESCALATION_DAYS, CRON_SECRET).

**Tasks**
1. `controllers/analyticsController.js` + routes (admin only), using MongoDB aggregation:
   - `GET /analytics/summary`: `{ total, byStatus: { SUBMITTED: n, ... }, overdue, escalated }`. **Overdue** = not `RESOLVED`/`REJECTED` and `createdAt` older than `ESCALATION_DAYS`.
   - `GET /analytics/by-category`: `[{ category, count }]` sorted by count desc.
   - `GET /analytics/resolution-time`: average hours between `createdAt` and `resolvedAt` per department (only resolved grievances), with department names, plus `resolvedCount`.
2. `controllers/auditLogController.js` + route (admin): `GET /audit-logs`: paginated StatusHistory, newest first, populate `changedBy` (name, role) and `grievance` (trackingId, title); optional filters `grievance`, `changedBy`, `from`, `to`.
3. `jobs/escalation.js`: export `runEscalation()` that finds grievances with status in `SUBMITTED, UNDER_REVIEW, IN_PROGRESS, REOPENED`, `createdAt` older than `ESCALATION_DAYS` days, and `escalated: false`; sets `escalated: true`; calls `notifyAdmins` with a message listing the tracking ID. Returns `{ escalatedCount }`. Also export `scheduleEscalation()` which uses `node-cron` with `0 */6 * * *`; call it from `server.js`.
4. `controllers/jobController.js` + `routes/jobRoutes.js`: `POST /jobs/escalate`, authorized by **either** a valid admin Bearer token **or** an `x-cron-secret` header equal to `CRON_SECRET` (compare with `crypto.timingSafeEqual`; if `CRON_SECRET` is unset, secret auth is disabled). Responds with `{ escalatedCount }`.

**Verification**
- Seed or edit `createdAt` of a grievance to be 8 days old; call `POST /jobs/escalate` with the secret header → `escalated: true`, admin notification created (TC-18). Call again → `escalatedCount: 0`.
- Wrong secret → 401/403; citizen token → 403.
- All three analytics endpoints return correct numbers against the seed data (cross-check one by hand).

---

## Phase 8 — Backend Tests and Hardening

**Goal:** automated tests for the README test cases, and a final backend review.

**README sections to re-read:** Testing (Strategy, Sample Test Cases TC-01 to TC-19), Security (entire table).

**Tasks**
1. Jest config for the server (`testEnvironment: node`). `tests/setup.js` connects to `MONGO_URI_TEST` (a **separate database name**; refuse to run if it equals `MONGO_URI`), clears collections between tests, and disconnects at the end.
2. Write `tests/auth.test.js` (TC-01 to TC-04) and `tests/grievance.test.js` (TC-05 to TC-17 and TC-18 via the escalation function). TC-19 stays a manual/script check from Phase 6 (document it in `docs/test-plan.md` later).
3. Add unit tests for `canTransition` and the tracking ID format.
4. Run `npm test` and `npm run test:coverage`; fix failures (explain each root cause to the user).
5. **Hardening review** against the README Security table, reporting a checklist of: bcrypt, JWT in header, active-user check (HTTP and Socket.IO), RBAC on every route, Joi on every body, mongo-sanitize, rate limit only on login/register, trust proxy, Helmet, CORS rules, upload limits, no `passwordHash` or `attachments.data` leaking. Fix any gap.
6. Produce a **Postman collection JSON** (`docs/postman_collection.json`) covering every endpoint, so the user can demo the API. (Variables: `baseUrl`, `token`.)

**Verification:** `npm test` all green; coverage report shown; hardening checklist printed with every row confirmed.

---

## Phase 9 — Client Foundation

**Goal:** React app shell: routing, auth, API layer, layout, server wake-up screen.

**README sections to re-read:** Tech Stack, Routing in Electron, Folder Structure (client/), Known Limitations (cold start), Security (JWT in header).

**Tasks (in `client/`)**
1. Scaffold with Vite React. Install `react-router-dom axios socket.io-client` and `tailwindcss @tailwindcss/vite` (Tailwind v4: plugin in `vite.config.js`, `@import "tailwindcss";` in `src/index.css`). Optionally `recharts`.
2. `vite.config.js`: `base: './'`, the Tailwind plugin, dev port 5173. `.env`: `VITE_API_BASE_URL`, `VITE_SOCKET_URL`.
3. `src/services/api.js`: Axios instance with `baseURL`; request interceptor adds `Authorization: Bearer <token>`; response interceptor: on 401 (except on login) clears storage and redirects to `#/login`. Export small functions per resource (`authApi`, `grievanceApi`, ...), added to as pages are built.
4. `src/context/AuthContext.jsx`: `user`, `token`, `login`, `register`, `logout`, `updateProfile`; restores session from `localStorage` and verifies with `GET /auth/me` on startup.
5. `src/App.jsx` with **`HashRouter`**, public routes (`/login`, `/register`), protected routes with a `RoleRoute` guard, and role-based default redirect after login (`citizen → /citizen`, `officer → /officer`, `admin → /admin`). Placeholder pages for now.
6. `components/common/LoadingScreen.jsx`: on app start, call `GET /health` (derive the root URL from `VITE_SOCKET_URL`) with retries up to ~90 s, showing **"Connecting to server…"** and a friendly message that the free server may take up to a minute to wake. Render the app only after success (or after the user clicks "Continue anyway").
7. Common components: `Button`, `Modal`, `Toast` (context-based), `Pagination`, `StatusBadge` (colors per status), `PriorityBadge`, `EmptyState`, `ErrorMessage`. Layout: `Navbar` (user name, role, logout, notification bell placeholder) and `Sidebar` (links per role).
8. `src/pages/auth/Login.jsx` and `Register.jsx` fully working against the backend (with validation messages from the API shown).
9. `utils/constants.js` (statuses, priorities, status colors) and `utils/helpers.js` (date formatting, error message extraction).

**Verification:** `npm run dev` with the backend running: register a citizen, log in, see the placeholder citizen page, refresh (session persists), log out; log in as seeded admin and officer and confirm they land on their own placeholder routes; a citizen manually visiting `#/admin` is redirected.

---

## Phase 10 — Citizen Pages

**Goal:** everything a citizen does.

**README sections to re-read:** Features (Citizen), API Endpoints (Grievances, Categories), Displaying Attachments in the UI, Status Workflow.

**Tasks**
1. `pages/citizen/FileGrievance.jsx`: form (title, description, category dropdown from `GET /categories`, priority, location text, up to 2 image inputs). Client-side checks mirroring the server: JPG/PNG only, ≤ 1 MB each, max 2; show previews. Submit as `FormData` (field name `attachments`). On success show the **tracking ID** prominently with a "Copy" button and a link to the detail page.
2. `pages/citizen/MyGrievances.jsx`: table/cards with filters (status, category, date range, search by tracking ID), pagination, `StatusBadge`.
3. `pages/citizen/GrievanceDetail.jsx`: header with tracking ID/status/priority/department; description and location; **attachments** via `AttachmentViewer`; `StatusTimeline` (from `statusHistory`); comments list (staff replies visible, internal never shown) plus an add-comment form; **Reopen** button (only when `RESOLVED` or `REJECTED` and `reopenCount < 1`, asks for a reason in a modal); **Feedback** form (only when `RESOLVED` and no feedback yet; 1–5 stars + comment) and read-only display once given.
4. `components/grievance/AttachmentViewer.jsx`: the **blob approach from the README** (Axios with `responseType: 'blob'` and the Bearer token, `URL.createObjectURL`, revoke on unmount/change). Never use a plain `<img src>` to the API.
5. `components/grievance/StatusTimeline.jsx` and `GrievanceCard.jsx`.
6. A "Track by ID" input in the citizen layout that calls `GET /grievances/track/:trackingId` and navigates to the result.
7. Profile page `pages/citizen/Profile.jsx` (edit name, phone, password) using `PATCH /auth/me`.

**Verification (walk through in the browser and report):** register → file a grievance with an image → see it in the list → open detail and see the image → (use Postman as officer to move it to RESOLVED) → reopen once → second reopen button is hidden → leave feedback on another resolved one. Try an oversized image and see the client-side message.

---

## Phase 11 — Officer Pages

**Goal:** the officer's department dashboard.

**README sections to re-read:** Features (Officer), API Endpoints (status, comments), Access Control Rules, Status Workflow.

**Tasks**
1. `pages/officer/OfficerDashboard.jsx`: department-scoped list with filters (status, priority, date), sorting, pagination, quick stats (counts by status for the department computed from the list endpoint or a lightweight filter query), highlight `escalated` items.
2. `pages/officer/UpdateGrievance.jsx` (or the officer view of the same detail page): shows all citizen info, attachments, timeline, public and internal comments. A **status panel** that offers only the **allowed next statuses** from `VALID_TRANSITIONS` (mirror the map in `client/src/utils/constants.js`, excluding `REOPENED`), a **mandatory remark** textarea, submit with confirmation. Add-comment form with an **"Internal note"** checkbox; internal comments are visually marked.
3. Reuse `AttachmentViewer`, `StatusTimeline`, badges.

**Verification:** log in as the seeded Roads officer; confirm only Roads grievances appear; move one through `UNDER_REVIEW → IN_PROGRESS → RESOLVED` with remarks; add an internal note and confirm the citizen account cannot see it; confirm the UI never offers an invalid transition.

---

## Phase 12 — Admin Pages

**Goal:** full admin console.

**README sections to re-read:** Features (Admin), API Endpoints (Departments, Users, Analytics, Audit Log, Grievances assign, Escalation).

**Tasks**
1. `pages/admin/AdminDashboard.jsx`: stat cards from `/analytics/summary` (total, per status, overdue, escalated) and quick links.
2. `pages/admin/Analytics.jsx`: charts for by-category (bar) and average resolution time by department (bar), status distribution (pie/bar). Use `recharts` or simple CSS bars.
3. `pages/admin/ManageDepartments.jsx`: list, create/edit modal (name, description, categories as tags), deactivate/reactivate; show server error for a duplicate category.
4. `pages/admin/ManageUsers.jsx`: list with role filter and search, create officer/admin modal (department picker for officers), edit, activate/deactivate (cannot deactivate self).
5. `pages/admin/AllGrievances.jsx` (add route): all grievances with filters; detail view with an **Assign/Reassign** panel (department and officer pickers; officer list filtered by the chosen department) and the same status-update panel as officers.
6. `pages/admin/AuditLog.jsx`: paginated table of `StatusHistory` (time, tracking ID link, from → to, changed by, remark) with simple filters.
7. Admin escalation indicator: list/filter `escalated` grievances (use `escalated` filter; add `?escalated=true` support to `GET /grievances` on the server if missing, and report that backend change).

**Verification:** as admin: create a department with a new category, create an officer for it, file a citizen grievance in that category and watch it route to that department; reassign a grievance; view the audit log entries for these actions; check charts match the seed numbers.

---

## Phase 13 — Real-Time Notifications in the UI

**Goal:** live updates through Socket.IO and a notification center.

**README sections to re-read:** Architecture (WSS, JWT in handshake), Socket.IO Authentication, API Endpoints (Notifications), Features.

**Tasks**
1. `src/context/SocketContext.jsx`: connect only when logged in, `io(VITE_SOCKET_URL, { auth: { token } })`, disconnect on logout, reconnect handling; expose the socket and an `unreadCount`.
2. Listen for `status-update` and `notification`: show a **toast**, increment the unread count, and refresh the open list/detail page if it concerns the same grievance (simple approach: a shared event bus or a `lastEvent` value in context that pages watch).
3. `components/layout/NotificationBell.jsx` in the `Navbar`: unread badge, dropdown with the latest notifications from `GET /notifications`, click → mark read and navigate to the grievance, "Mark all read" button.
4. Full `pages/common/Notifications.jsx` page with pagination.
5. Admin receives escalation notifications live (room `admins`).

**Verification:** two browser windows (citizen and officer): officer updates a status and the citizen gets a toast, the bell increments and the detail page refreshes without reload. Log out and confirm the socket disconnects. Offline-then-online: notification is still in the list.

---

## Phase 14 — Electron Desktop Shell

**Goal:** the React app running inside Electron, in dev and in packaged mode.

**README sections to re-read:** Architecture (Electron Main vs Renderer, contextIsolation), Routing in Electron, Build Installers, electron-builder Configuration, Security (CORS and Electron).

**Tasks (in `desktop/`)**
1. `package.json` with `"main": "main.js"`, devDependencies `electron` and `electron-builder`, scripts exactly as in the README (`dev`, `build:win`, `build:mac` both with `--publish never`).
2. `main.js`: create a `BrowserWindow` (width ~1280, height ~800, min size) with `webPreferences: { preload, contextIsolation: true, nodeIntegration: false, sandbox: true }`. If `app.isPackaged` → `loadFile(path.join(__dirname, 'dist', 'index.html'))`; else → `loadURL('http://localhost:5173')`. Open external links in the system browser (`setWindowOpenHandler`), block in-app navigation to other origins. Standard app lifecycle (quit on all windows closed except macOS behavior).
3. `preload.js`: `contextBridge.exposeInMainWorld('desktop', { platform: process.platform })` only.
4. `electron-builder.yml` exactly as in the README. Create `assets/` and generate placeholder icons (`icon.png` 1024×1024 plus `.ico` and `.icns`); tell the user how to replace them.
5. Build flow script (document in `desktop/README-build.md` or the main README): `cd client && npm run build` (uses `client/.env.production`) → copy `client/dist` into `desktop/dist` → `npm run build:mac`. Add a small helper script `desktop/scripts/copy-client.js` (Node `fs.cpSync`) so the copy step is cross-platform, and a package script `prebuild:win` / `prebuild:mac` is **not** needed — keep the steps explicit.

**Verification**
- Dev mode: start backend + client, run `npm run dev` in `desktop/`; log in and use the app inside the Electron window.
- Packaged test locally on the user's Mac: build the client with `VITE_API_BASE_URL` pointing at the **local** backend first, run `npm run build:mac`, open the app from `desktop/release/`, log in, check there is **no blank screen** (HashRouter works), open DevTools → Network → read the **actual `Origin` header** and report it (README note); confirm requests succeed and Socket.IO connects.

---

## Phase 15 — Deployment and Installers

**Goal:** backend live on Render, DB on Atlas, final installers built.

**README sections to re-read:** Deployment (Render, Atlas, Known Limitations), Build Installers, Security, Setup & Run.

**Tasks**
1. Pre-flight checks: `npm start` works locally in production mode (`NODE_ENV=production`); no `.env` committed; `server/package.json` has the right `engines` (`node >= 20`).
2. Walk the user through Atlas (cluster, DB user, Network Access `0.0.0.0/0`) and Render (Web Service, root `server`, build `npm install`, start `npm start`, health check `/health`, environment variables exactly as the README list, **without** `CORS_ORIGINS`). Do **not** run the seed against the production database; instead create the first admin through a one-time method that the AI proposes to the user (for example, run `seed.js` locally **once** against a *separate* dev DB, or temporarily create an admin via the Atlas UI/shell with a bcrypt hash) and then **change the default password immediately**. Explain the trade-offs and let the user choose.
3. After the service is live: test `/health`, login, grievance filing and the attachment endpoint using the Render URL in Postman.
4. Set up the cold-start workaround: configure **cron-job.org** to `POST https://<render-url>/api/v1/jobs/escalate` every 6 hours with header `x-cron-secret`. Document the exact fields to fill in.
5. Build the production client: `client/.env.production` with the Render HTTPS URLs → `npm run build` → copy to `desktop/dist`.
6. Build the `.dmg` on the user's MacBook (`npm run build:mac`). For the `.exe`: instruct how to build on a Windows PC (copy the repo, `npm install` in `client` and `desktop`, build the client, copy dist, `npm run build:win`) — only if the professor needs it. Document the unsigned-app warnings and how to open the app (README table).
7. Final end-to-end test using the **installed** app against the **live** backend: register, file with image, officer updates, citizen sees live notification, admin analytics.

**Verification:** a short pass/fail checklist of the end-to-end flow, the actual `Origin` header seen by the live server (log it once temporarily if needed, then remove the log), and the location of the final installer(s).

---

## Phase 16 — Final Documentation and Polish

**Goal:** everything the Software Engineering course will grade, and a README that matches the code.

**README sections to re-read:** the whole README.

**Tasks**
1. Fill `docs/SRS.md`: purpose, scope, definitions, user classes (citizen, officer, admin), functional requirements (numbered FR-1…), non-functional requirements (security, performance, availability limits of the free tier, usability), constraints, assumptions. Derive them from the README Features and API sections.
2. Create **Mermaid** (`.mmd` or fenced in `.md`) diagrams in `docs/`: use case diagram, class diagram, ER diagram (copy from README), DFD level 0 and level 1, sequence diagrams for "File grievance" and "Update status", and the state diagram. Also tell the user how to export PNGs (mermaid.live) because the README folder tree lists `.png` files.
3. Fill `docs/test-plan.md`: strategy, environments, the TC-01…TC-19 table with **actual results** from Phase 8 and the manual checks (TC-19), plus a short UAT script for the demo.
4. Fill `docs/risk-analysis.md`: free-tier cold starts, images in MongoDB size limits, unsigned installers, single-process cron, JWT in `localStorage` (XSS consideration and the mitigation by Electron `contextIsolation`), and mitigations.
5. Reconcile `README.md` with reality: any endpoint, env var, script or file that changed during the build must be updated; remove anything not implemented or move it to Future Enhancements; add real screenshots to `docs/screenshots/` and link them.
6. Final code cleanup: remove unused files and `console.log` noise, make sure `.env.example` files are complete for `server/` and `client/`, run the tests one last time, and tag the release (`git tag v1.0.0`).
7. Prepare a **demo script** (`docs/DEMO.md`): the exact click-by-click flow to present the project in 5–7 minutes, including seeded credentials and what to say for each feature.

**Verification:** a final checklist showing every README feature mapped to the phase and file that implements it, and `npm test` passing.

---

## Phase Report Template (print this at the end of every phase)

```
### Phase N complete — <name>
**Files created/edited:** <list>
**What you just built and why:** <5–10 plain-language lines>
**How to test it yourself:** <exact steps/commands>
**Verification results:** <actual outputs, pass/fail per check>
**README deviations or open questions:** <none, or list>
**Suggested commit message:** <e.g. "Phase 4: grievance filing and reading">
Progress Tracker updated. Waiting for "proceed".
```
