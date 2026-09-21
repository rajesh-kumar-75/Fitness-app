# Fitness and Workout Management Platform

A production-style, scalable foundation for a Fitness and Workout Management Platform built using the **MEAN stack** (MongoDB, Express.js, Angular 19, Node.js) with end-to-end **JWT authentication**, **bcrypt password hashing**, **Role-Based Access Control (USER, TRAINER, ADMIN)**, a **User Profile Module with dynamic BMI calculation**, an **Exercise Management Module with multi-criteria filtering**, and a **Health Check & Diagnostics System**.

---

## Architecture Overview

```
Fitness/
├── .gitignore
├── README.md
├── backend/
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   └── src/
│       ├── config/
│       │   ├── db.js                 # MongoDB Mongoose lifecycle & connection logic
│       │   └── env.js                # Centralized environment variable management
│       ├── controllers/
│       │   ├── admin.controller.js   # Platform KPIs, user/trainer management, billing & reports
│       │   ├── auth.controller.js    # Register, login, me, logout handlers
│       │   ├── chat.controller.js    # Direct 1-on-1 messaging & conversations
│       │   ├── exercise.controller.js# Exercise CRUD, search, filtering & seeder
│       │   ├── health.controller.js  # System & MongoDB readyState diagnostics
│       │   ├── nutrition.controller.js # Food database, daily logs, macros
│       │   ├── progress.controller.js# Weight, measurements & strength analytics
│       │   ├── trainer.controller.js # Trainer roster, client studio, diet plans
│       │   └── user.controller.js    # Profile retrieval, updates & BMI calculation
│       ├── middlewares/
│       │   ├── auth.middleware.js    # JWT verification & RBAC authorization
│       │   ├── error.middleware.js   # Centralized error handler & formatting
│       │   └── notFound.middleware.js# 404 Route Not Found handler
│       ├── models/
│       │   ├── conversation.model.js # Socket.IO chat conversation schema
│       │   ├── diet-plan.model.js    # Custom prescribed macro & meal schedule
│       │   ├── exercise.model.js     # Mongoose Exercise schema, enums & text indexes
│       │   ├── food.model.js         # Nutrition food items database
│       │   ├── measurement.model.js  # Body measurements time-series schema
│       │   ├── message.model.js      # Socket.IO chat message persistence schema
│       │   ├── nutrition-log.model.js# Daily meal logs and calorie totals
│       │   ├── payment.model.js      # Financial transactions & payment history
│       │   ├── subscription.model.js # User membership tiers & billing cycles
│       │   ├── trainer-client.model.js # Trainer-client relationship & status
│       │   ├── user.model.js         # Mongoose User schema, profile fields, bcrypt & JWT
│       │   ├── workout-log.model.js  # Active and completed workout session logs
│       │   └── workout-plan.model.js # 7-day workout routine & schedule schema
│       ├── routes/
│       │   ├── admin.routes.js       # Admin Console endpoints (/api/v1/admin)
│       │   ├── auth.routes.js        # Authentication endpoints (/api/v1/auth)
│       │   ├── chat.routes.js        # Coaching chat endpoints (/api/v1/chat)
│       │   ├── exercise.routes.js    # Exercise CRUD endpoints (/api/v1/exercises)
│       │   ├── health.routes.js      # Health check endpoint (/api/v1/health)
│       │   ├── nutrition.routes.js   # Food & nutrition endpoints (/api/v1/nutrition)
│       │   ├── progress.routes.js    # Progress & analytics endpoints (/api/v1/progress)
│       │   ├── trainer.routes.js     # Trainer Studio endpoints (/api/v1/trainers)
│       │   ├── user.routes.js        # Profile endpoints (/api/v1/users/profile)
│       │   ├── workout.routes.js     # Workout & schedule endpoints (/api/v1/workouts)
│       │   └── index.js              # Central API v1 router
│       ├── socket/
│       │   └── index.js              # Socket.IO initialization, JWT handshake & events
│       ├── utils/
│       │   ├── apiError.js           # Custom operational error class
│       │   └── apiResponse.js        # Standardized API response structure
│       ├── app.js                    # Express app configuration & middleware
│       └── server.js                 # HTTP server bootstrap, Socket.IO & seeders
└── frontend/
    ├── angular.json
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── environments/
        │   ├── environment.ts        # Production API environment
        │   └── environment.development.ts # Development API environment
        ├── app/
        │   ├── core/
        │   │   ├── guards/
        │   │   │   ├── auth.guard.ts     # Route guard for protected pages
        │   │   │   ├── guest.guard.ts    # Route guard for public pages (/login, /register)
        │   │   │   └── role.guard.ts     # Role-based access control guard (USER, TRAINER, ADMIN)
        │   │   ├── interceptors/
        │   │   │   └── auth.interceptor.ts # Attaches JWT token & handles 401/403
        │   │   ├── models/
        │   │   │   ├── admin.model.ts    # Admin statistics, users, trainers, subs, payments
        │   │   │   ├── auth.model.ts     # User & Auth TypeScript interfaces
        │   │   │   ├── chat.model.ts     # Chat conversation & message interfaces
        │   │   │   ├── exercise.model.ts # Exercise, MuscleGroup, Difficulty interfaces
        │   │   │   ├── health.model.ts   # System Health TypeScript interfaces
        │   │   │   ├── nutrition.model.ts# Food & daily nutrition interfaces
        │   │   │   ├── progress.model.ts # Measurement & chart data interfaces
        │   │   │   ├── trainer.model.ts  # Trainer profile & client telemetry interfaces
        │   │   │   ├── user-profile.model.ts # User Profile & BMI TypeScript interfaces
        │   │   │   └── workout.model.ts  # Workout plan, day, exercise & log interfaces
        │   │   └── services/
        │   │       ├── admin.service.ts  # Admin platform management HttpClient service
        │   │       ├── auth.service.ts   # Signals-based Authentication state service
        │   │       ├── chat.service.ts   # Socket.IO client & real-time messaging service
        │   │       ├── exercise.service.ts # Exercise CRUD & filtering HttpClient service
        │   │       ├── health.service.ts # Health check HttpClient service
        │   │       ├── nutrition.service.ts # Food & daily meal logging service
        │   │       ├── progress.service.ts # Measurements & analytics HttpClient service
        │   │       ├── trainer.service.ts# Trainer coaching studio service
        │   │       ├── user-profile.service.ts # Profile retrieval & update service
        │   │       └── workout.service.ts# Workout routines & active tracker service
        │   ├── features/
        │   │   ├── admin/                # Super Admin Console (KPIs, Users, Coaches, Subs, Payments, Reports)
        │   │   ├── auth/                 # Sign In & Sign Up reactive form components
        │   │   ├── chat/                 # Real-time coach-client chat with Socket.IO
        │   │   ├── dashboard/            # Protected user workspace with role previews
        │   │   ├── exercises/            # Exercise Library, filters, search & detail modal
        │   │   ├── health-check/         # Live system & database diagnostics dashboard
        │   │   ├── nutrition/            # Daily nutrition & food database tracker
        │   │   ├── profile/              # User Profile view & edit with live BMI gauge
        │   │   ├── progress/             # Weight, body measurements & strength analytics
        │   │   ├── trainer/              # Trainer Studio & Client telemetry dashboard
        │   │   └── workouts/             # Workout plans, weekly schedule, live tracker & history
        │   ├── shared/
        │   │   └── components/
        │   │       └── line-chart/       # Reusable SVG line chart component
        │   ├── app.component.*           # App shell with responsive navigation & user chip
        │   ├── app.config.ts             # Angular providers (HttpClient, Interceptors, Router)
        │   └── app.routes.ts             # Application routes & guards
        ├── styles.scss                   # Global design tokens, Google Fonts & theme reset
        └── index.html                    # SEO meta tags & app mount
```

---

## Exercise Management Module

### Features:
- **Exercise Library**: Browse exercises with thumbnail previews, color-coded muscle group badges, difficulty tags, and equipment chips.
- **Search & Filtering**:
  - Real-time text search on name and description.
  - Interactive Muscle Group filter pills (`All`, `Chest`, `Back`, `Shoulders`, `Biceps`, `Triceps`, `Legs`, `Glutes`, `Core`, `Cardio`).
  - Difficulty dropdown (`All`, `Beginner`, `Intermediate`, `Advanced`).
- **Exercise Details Modal**:
  - Full exercise demonstration image and video link.
  - Numbered step-by-step instructions.
  - Target muscle group, difficulty level, and required equipment.
- **Admin Authorization & Management**:
  - Normal users (`USER`, `TRAINER`) can browse and view exercises.
  - Only `ADMIN` users can create, update, or delete exercises (enforced on backend with `authorize('ADMIN')` and conditionally rendered in Angular).
  - Built-in admin modal to create or edit exercises with form validation.
- **Auto-Seeder**: Automatically seeds 9 standard compound and isolation exercises on initial startup if the database collection is empty.

---

## API Endpoints

### 1. Health Diagnostics
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Public | Returns server status, uptime, memory, and MongoDB connection status |

### 2. Authentication
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register a new user (`USER` or `TRAINER`) |
| `POST` | `/api/v1/auth/login` | Public | Login with email and password |
| `GET` | `/api/v1/auth/me` | Protected (`Bearer`) | Retrieve current user's profile |
| `POST` | `/api/v1/auth/logout` | Protected (`Bearer`) | Logout confirmation endpoint |

### 3. User Profile
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users/profile` | Protected (`Bearer`) | Retrieve current user profile and calculated BMI |
| `PUT` | `/api/v1/users/profile` | Protected (`Bearer`) | Update authenticated user profile |

### 4. Exercise Management
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/exercises` | Protected (`Bearer`) | Retrieve exercises with search, muscleGroup, difficulty filters |
| `GET` | `/api/v1/exercises/:id` | Protected (`Bearer`) | Retrieve single exercise details by ID |
| `POST` | `/api/v1/exercises` | **ADMIN only** | Create a new exercise |
| `PUT` | `/api/v1/exercises/:id` | **ADMIN only** | Update an existing exercise |
| `DELETE` | `/api/v1/exercises/:id` | **ADMIN only** | Delete an exercise by ID |

### 5. Workout Management
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/workouts/plans` | Protected (`Bearer`) | Get all workout plans (templates & assigned) |
| `GET` | `/api/v1/workouts/plans/active` | Protected (`Bearer`) | Get current user's active workout plan & today's workout |
| `POST` | `/api/v1/workouts/plans` | **TRAINER / ADMIN** | Create a new workout plan with 7-day schedule |
| `POST` | `/api/v1/workouts/plans/:id/adopt` | Protected (`Bearer`) | Set a workout plan as user's active plan |
| `POST` | `/api/v1/workouts/plans/:id/assign` | **TRAINER / ADMIN** | Assign a workout plan to a member |
| `POST` | `/api/v1/workouts/session/start` | Protected (`Bearer`) | Start a new workout session for a day |
| `GET` | `/api/v1/workouts/session/active` | Protected (`Bearer`) | Get user's current in-progress workout session |
| `PUT` | `/api/v1/workouts/session/:id/progress` | Protected (`Bearer`) | Save progress during an active workout session |
| `POST` | `/api/v1/workouts/session/:id/complete` | Protected (`Bearer`) | Finish and log a completed workout session |
| `POST` | `/api/v1/workouts/session/:id/cancel` | Protected (`Bearer`) | Cancel / abandon an in-progress workout session |
| `GET` | `/api/v1/workouts/history` | Protected (`Bearer`) | Get user's completed workout logs and summary stats |

### 6. Nutrition Tracking & Food Database
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/nutrition/foods` | Protected (`Bearer`) | Search & filter foods in database |
| `POST` | `/api/v1/nutrition/foods` | Protected (`Bearer`) | Create custom or verified food item |
| `GET` | `/api/v1/nutrition/daily` | Protected (`Bearer`) | Get daily calories, macro targets & meal logs (`?date=YYYY-MM-DD`) |
| `POST` | `/api/v1/nutrition/log` | Protected (`Bearer`) | Log food item to meal (`Breakfast`, `Lunch`, `Dinner`, `Snacks`) |
| `DELETE` | `/api/v1/nutrition/log/:logId/item/:itemId` | Protected (`Bearer`) | Remove a logged food item |

### 7. Progress & Analytics
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/progress/overview` | Protected (`Bearer`) | High-level metrics (total workouts, minutes, current weight) |
| `GET` | `/api/v1/progress/measurements` | Protected (`Bearer`) | List all recorded body measurements |
| `POST` | `/api/v1/progress/measurements` | Protected (`Bearer`) | Log body measurements (weight, chest, waist, hips, etc.) |
| `DELETE` | `/api/v1/progress/measurements/:id` | Protected (`Bearer`) | Delete a measurement entry |
| `GET` | `/api/v1/progress/weight` | Protected (`Bearer`) | Time-series weight data & stats (start, min, max, change) |
| `GET` | `/api/v1/progress/strength` | Protected (`Bearer`) | Time-series strength progression & PR for exercises |
| `GET` | `/api/v1/progress/workouts` | Protected (`Bearer`) | Paginated workout history with volume & set stats |

---

## Setup & Running Instructions

### Prerequisites
- **Node.js**: v20.x, v22.x, or v24.x
- **MongoDB**: Local MongoDB instance running on `mongodb://localhost:27017` (or MongoDB Atlas URI)

### 1. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Start in development mode (with nodemon)
npm run dev

# Or start in production mode
npm start
```
The backend will run on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Start the Angular development server
npm start
```
The frontend will run on `http://localhost:4200`.

---

## Workout Management Module

### Features:
- **Workout Plans & Schemas**:
  - `WorkoutPlan`: Plan title, description, difficulty, goal, duration, days per week, and 7-day schedule array.
  - `WorkoutDay`: Day of week (Monday–Sunday), focus area, estimated duration, and array of scheduled exercises.
  - `WorkoutExercise`: Exercise reference, target sets, target reps, target weight (kg), rest time (seconds), and notes.
  - `WorkoutLog`: User session tracker tracking startedAt, completedAt, duration, exercises with per-set completion, actual weight lifted, completed reps, and status (`in-progress`, `completed`, `abandoned`).
- **7-Day Interactive Weekly Schedule**:
  - Visual week schedule cards with today highlight.
  - Daily workout breakdown: exercises, sets, reps, weight, and rest time.
  - Active session resume banner if user navigates away mid-workout.
- **Live Workout Tracker**:
  - Per-set checkboxes with instant completion state.
  - Stepper controls (`-` / `+`) for actual weight and completed reps.
  - Animated **Rest Countdown Timer** with `+30s` and `Skip Rest` controls.
  - Auto-saving of progress to backend on set completion or adjustment.
  - Post-workout Celebration modal with summary stats (duration, exercises, sets completed).
- **Trainer Program Builder**:
  - Available for `TRAINER` and `ADMIN` roles.
  - 7-day schedule editor with rest day toggles and exercise picker from the Exercise Library.
  - Plan adoption and assignment to members.
- **Pre-Seeded Programs**:
  - Automatically seeds "4-Day Upper / Lower Hypertrophy Split" and "3-Day Full Body Strength Foundation" linked to real exercise library records.

---

## Verification & Testing

### 1. Exercise API Testing via CLI
```bash
# 1. Login as user to retrieve token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@fitness.test","password":"password123"}'

# 2. Get exercises filtered by muscleGroup
curl -X GET "http://localhost:5000/api/v1/exercises?muscleGroup=Chest" \
  -H "Authorization: Bearer <USER_TOKEN>"

# 3. Attempt creation as normal user (returns 403 Forbidden)
curl -X POST http://localhost:5000/api/v1/exercises \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Desc","muscleGroup":"Chest","equipment":"Barbell","difficulty":"Beginner","instructions":["Step 1"]}'

# 4. Login as Admin & Create Exercise (returns 201 Created)
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fitness.test","password":"password123"}'

curl -X POST http://localhost:5000/api/v1/exercises \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Incline Dumbbell Flyes","description":"Upper chest isolation","muscleGroup":"Chest","equipment":"Dumbbell","difficulty":"Beginner","instructions":["Step 1","Step 2"]}'
```

### 2. Workout API Testing via CLI
```bash
# 1. Login to get access token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@fitness.test","password":"password123"}'

# 2. Get active workout plan and today's schedule
curl -X GET http://localhost:5000/api/v1/workouts/plans/active \
  -H "Authorization: Bearer <USER_TOKEN>"

# 3. Start a workout session
curl -X POST http://localhost:5000/api/v1/workouts/session/start \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"planId":"<PLAN_ID>","dayOfWeek":"Monday"}'

# 4. Finish workout session
curl -X POST http://localhost:5000/api/v1/workouts/session/<SESSION_ID>/complete \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"exercises":[],"notes":"Awesome workout!"}'
```

### 3. Frontend Interactive Testing
- Open `http://localhost:4200/` and log in.
- Click **"Workouts"** in the top navigation bar to access the Workout Dashboard.
- View your **Active Workout Plan**, **Today's Scheduled Workout**, and the **7-Day Weekly Grid**.
- Click **"Start Today's Workout"** or any day's **"Start"** button to launch the live workout session tracker.
- Check off sets as you complete them; watch the **Rest Countdown Timer** trigger automatically.
- Adjust reps or weight with the `-` / `+` steppers; notice the real-time background autosave.
- Click **"Finish Workout"** to complete the session and view your summary stats on the celebration screen.
- Log in as a Trainer (`sarah@fitness.test` / `password123`) or Admin to access **"Create Plan"** to build custom 7-day programs with the Exercise Library.

---

## Trainer Management Module

### Features:
- **Trainer Studio (`/trainer`)**:
  - Dedicated coaching workspace for `TRAINER` and `ADMIN` roles.
  - Active client roster with vitals preview and assigned routine/diet indicators.
  - Pending client inquiries tab with 1-click **Accept** or **Decline**.
  - Public Trainer Profile editor (specialties, certifications, experience, bio, accepting clients toggle).
- **Client Studio (`/trainer/clients/:clientId`)**:
  - Full client telemetry: vitals, BMI category, current routines.
  - **Assign Workout Plan**: Select from system workout programs to assign directly to the client.
  - **Prescribe Custom Diet Plan**: Macro targets (Calories, Protein, Carbs, Fat), dynamic meal schedule builder (meals, times, target calories, suggested foods, instructions), and guidelines.
  - **Progress Analytics**: 30-day interactive SVG weight progression chart, exercise-specific strength progression chart, completed workout history, and body measurements table.
- **Trainer Directory (`/trainers`)**:
  - Public searchable directory for athletes to browse certified personal coaches.
  - Send coaching requests with personalized goals message.
  - Status banner tracking active coach or pending inquiry.

---

## Real-Time Communication Module (Socket.IO)

### Features:
- **Direct User-to-Trainer Chat (`/chat`)**:
  - Instant bidirectional real-time messaging between athletes and their assigned trainers.
  - Adaptive layout: direct 1-on-1 thread for athletes, and client conversation roster for trainers.
- **Real-Time Presence & Online Status**:
  - In-memory presence registry tracking active socket connections.
  - Real-time `● Online` and `○ Offline` badges on chat partner cards and conversation lists.
- **Typing Indicators**:
  - Real-time "Coach Sarah is typing..." indicator with animated bouncing dots.
- **Read Receipts & Unread Counters**:
  - Message status checkmarks: `✓` for sent, `✓✓` for read.
  - Real-time unread badge counters in the top navigation bar (`/chat`).
- **MongoDB Persistence**:
  - All conversations and messages stored in MongoDB (`Conversation` and `Message` models) with pagination and history retrieval.
- **JWT Socket Authentication**:
  - Handshake authentication verifying JWT Bearer token before establishing socket connection.
  - Sockets join personal rooms (`user_<id>`) and conversation rooms (`conversation_<id>`) with strict participant authorization.

### Chat API Endpoints:
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/chat/unread-count` | Get total unread messages count | Authenticated |
| `GET` | `/api/v1/chat/conversations` | Get all active user conversations | Authenticated |
| `POST` | `/api/v1/chat/conversations` | Get or create conversation with partner | Authenticated |
| `GET` | `/api/v1/chat/conversations/:id/messages` | Get message history for conversation | Participant |
| `POST` | `/api/v1/chat/conversations/:id/messages` | Send message (REST fallback) | Participant |
| `PATCH` | `/api/v1/chat/conversations/:id/read` | Mark conversation messages as read | Participant |

### Real-Time Socket.IO Events:
| Event | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join_conversation` | Client → Server | `{ conversationId }` | Join conversation room |
| `leave_conversation` | Client → Server | `{ conversationId }` | Leave conversation room |
| `send_message` | Client → Server | `{ conversationId, content }` | Send message to room |
| `new_message` | Server → Client | `Message` | Broadcast message to room |
| `typing_start` | Client → Server | `{ conversationId, recipientId }` | Dispatch typing start |
| `typing_stop` | Client → Server | `{ conversationId, recipientId }` | Dispatch typing stop |
| `user_typing` | Server → Client | `{ conversationId, userId, isTyping }` | Broadcast typing status |
| `mark_as_read` | Client → Server | `{ conversationId }` | Mark messages as read |
| `messages_read` | Server → Client | `{ conversationId, readBy, readAt }` | Broadcast read receipt |
| `user_presence` | Server → Client | `{ userId, status, timestamp }` | Broadcast online/offline |

---

## Admin Management & Intelligence Console

### Features:
- **Super Administrator Console (`/admin`)**:
  - Protected by both `authGuard` and `roleGuard('ADMIN')`.
  - Accessible only by users with the `ADMIN` role.
  - Multi-tab command center: **Overview**, **Users**, **Trainers**, **Exercises**, **Workouts**, **Subscriptions**, **Payments**, and **Reports**.
- **1. Overview & Platform Intelligence**:
  - Live KPI metrics: Total Users (with active/coach breakdowns), Total Financial Revenue & Monthly Recurring Revenue (MRR), Active Subscriptions (Pro & Elite breakdown), and Content Totals (Exercises, Workout Plans, Completed Logs).
  - Split activity feeds: Recent User Registrations and Recent Payment Transactions.
- **2. User Management**:
  - Real-time search by user name or email.
  - Multi-criteria filtering: Role (`All`, `USER`, `TRAINER`, `ADMIN`) and Status (`All`, `Active`, `Inactive`).
  - Server-side pagination with Next/Previous navigation.
  - Action buttons: Toggle user active status (suspend/activate), change user role with modal dialog, delete user account with confirmation modal.
  - **Self-Protection Safeguard**: Admins cannot suspend, demote, or delete their own active account.
- **3. Trainer Management**:
  - Directory of certified coaches with client metrics (active clients count, total clients count, workout plans created).
  - Capacity toggle: Easily switch a trainer's client acceptance status (`Accepting` vs `Full`).
- **4. Exercise Management**:
  - Complete database inventory of exercises with muscle group and difficulty badges, plus 1-click deletion.
- **5. Workout Management**:
  - Global overview of all created workout routines across the platform with creator details and 1-click deletion.
- **6. Subscription Management**:
  - Plan tier breakdown cards: Free ($0/mo), Pro Athlete ($19/mo), and Elite Coaching ($49/mo).
  - Member subscription table tracking plan tier, billing cycle (monthly/yearly), price, status, and renewal dates.
- **7. Payment Overview**:
  - Financial transaction log displaying transaction IDs, member names, payment amounts, currencies, payment methods, and timestamps.
- **8. Reports & Analytics**:
  - Interactive SVG trend charts for Member Registration Growth and Revenue Trajectory ($ USD).

### Admin API Endpoints:
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/stats` | **ADMIN only** | Get high-level platform KPIs and recent activity feeds |
| `GET` | `/api/v1/admin/users` | **ADMIN only** | List users with search, role/status filtering, and pagination |
| `PATCH` | `/api/v1/admin/users/:id/status` | **ADMIN only** | Suspend or activate a user account |
| `PATCH` | `/api/v1/admin/users/:id/role` | **ADMIN only** | Change a user's role (`USER`, `TRAINER`, `ADMIN`) |
| `DELETE` | `/api/v1/admin/users/:id` | **ADMIN only** | Delete a user account and cascade relationships |
| `GET` | `/api/v1/admin/trainers` | **ADMIN only** | List trainers with client and plan metrics |
| `PATCH` | `/api/v1/admin/trainers/:id` | **ADMIN only** | Update trainer profile & accepting clients capacity |
| `GET` | `/api/v1/admin/workouts` | **ADMIN only** | Get all workout programs across the platform |
| `DELETE` | `/api/v1/admin/workouts/:id` | **ADMIN only** | Delete a workout program |
| `GET` | `/api/v1/admin/subscriptions` | **ADMIN only** | Get all member subscriptions |
| `PATCH` | `/api/v1/admin/subscriptions/:id/status` | **ADMIN only** | Update subscription status |
| `GET` | `/api/v1/admin/payments` | **ADMIN only** | Get all payment transactions |
| `GET` | `/api/v1/admin/reports` | **ADMIN only** | Get time-series intelligence data for charts |

### Pre-Seeded Accounts:
| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| `ADMIN` | `admin@fitness.test` | `password123` | Full Super Admin Console (`/admin`), Exercise/Workout Management |
| `TRAINER` | `sarah@fitness.test` | `password123` | Trainer Studio (`/trainer`), Client Studio, Program Builder, Chat |
| `USER` | `alex@fitness.test` | `password123` | Member Dashboard, Workouts, Nutrition, Progress, Chat |

