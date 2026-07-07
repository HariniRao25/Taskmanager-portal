# ⚡ TeamFlow — Unified Systems Engineering Platform

> A full-stack team & project management platform for engineering teams — projects, Kanban task tracking with dependencies, incident management, a code-review workflow, real-time notifications, and analytics dashboards.

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the App](#-running-the-app)
- [Sharing via ngrok (single-origin)](#-sharing-via-ngrok-single-origin)
- [API Reference](#-api-reference)
- [Roles & Permissions](#-roles--permissions)
- [Data Models](#-data-models)
- [Business Rules](#-business-rules)
- [Available Scripts](#-available-scripts)
- [License](#-license)

---

## 🧭 Overview

**TeamFlow** is a MERN-stack (MongoDB, Express, React, Node.js) application that gives engineering teams a single place to plan work and respond to incidents. It combines a **Kanban board** with task dependencies and circular-dependency detection, a **code-review workflow** with automatic reviewer fallback, **incident tracking** with investigation timelines, and **real-time notifications** — all backed by an analytics **reports** module.

Authentication is JWT-based, access is role-aware, and the UI is a modern dark-themed single-page app.

---

## ✨ Features

### 🔐 Authentication & Users
- Register / login with hashed passwords (bcrypt) and JWT sessions (30-day expiry)
- Four roles: **Admin**, **Project Manager**, **Developer**, **Viewer**
- Profile management and a directory of all team members
- Automatic `lastActiveAt` tracking (used by the review-reassignment rule)

### 📁 Projects
- Create, edit, delete projects with status, priority, members, dates, tags, and progress
- Any authenticated user can create a project; editing/deleting is limited to the **owner or an admin**
- Search + status filtering; per-project task statistics

### ✅ Tasks (Kanban + List)
- Dual views: **Kanban board** and **List** view
- Statuses: `todo`, `in_progress`, `review`, `done`, `blocked`, `cancelled`
- Priorities, assignees, due dates, estimated hours, tags, and threaded comments
- **Task dependencies** (finish-to-start, start-to-start, finish-to-finish) with **automatic circular-dependency rejection**
- Reviewer & fallback-reviewer assignment; blocked-reason capture

### 🚨 Incidents
- Report incidents with severity (`low` → `critical`) and status (`open`, `investigating`, `resolved`, `escalated`)
- Assign an investigator, add an **investigation timeline**, and mark resolved
- Severity summary cards and filtering

### ⭐ Review Workflow
- Reviews are generated when tasks move into the review stage
- Assigned reviewer can **approve** (→ task `done`) or **reject** (→ task `in_progress`) with feedback
- **Reassign** reviews to a fallback reviewer, with an inactivity-based recommendation rule

### 🔔 Notifications
- In-app notification center + topbar dropdown with unread counts
- Typed notifications (task assigned, status changed, review requested/completed, incident raised, deadline approaching, comment added, project update)
- Mark-as-read / mark-all-read / delete

### 📊 Reports & Analytics
- System-wide KPIs (projects, tasks, incidents, team members, completion rate)
- Charts: task status & priority breakdowns, incident severity & status, team velocity, and a project-health table
- Filter by project and date range

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, React Router 7, Axios, Recharts, Lucide Icons, React Hot Toast, date-fns, Socket.IO client |
| **Backend** | Node.js, Express 4, Mongoose 7, JSON Web Tokens, bcryptjs, Socket.IO, Multer, dotenv, CORS |
| **Database** | MongoDB |
| **Tooling** | Create React App (react-scripts), Nodemon |

---

## 📂 Project Structure

```
Taskmanager-portal/
├── backend/
│   ├── config/            # Database connection
│   ├── controllers/       # Route handlers (auth, projects, tasks, incidents, reviews, reports, notifications)
│   ├── events/            # Notification emitter
│   ├── middleware/        # JWT auth (protect / authorize), error handler
│   ├── models/            # Mongoose schemas (User, Project, Task, Incident, Review, Notification)
│   ├── routes/            # Express routers
│   ├── server.js          # App entry — Express + Socket.IO, serves the built frontend
│   └── .env               # Backend environment variables (not committed publicly)
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/Layout/   # Sidebar, Topbar, Layout
│   │   ├── context/            # AuthContext, NotificationContext
│   │   ├── pages/              # Dashboard, Projects, Tasks, Incidents, Reviews, Reports, Notifications, Login, Register
│   │   ├── services/api.js     # Axios instance + API modules
│   │   └── index.css           # Design system / theme
│   └── .env.production         # REACT_APP_API_URL=/api (single-origin build)
│
├── package.json           # Root convenience scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- **MongoDB** running locally or a MongoDB Atlas connection string

### 1. Clone the repository
```bash
git clone https://github.com/HariniRao25/Taskmanager-portal.git
cd Taskmanager-portal
```

### 2. Install dependencies
```bash
# From the repo root — installs both backend and frontend
npm run install:all

# …or manually
cd backend  && npm install
cd ../frontend && npm install
```

### 3. Configure environment variables
Create `backend/.env` (see [Environment Variables](#-environment-variables)).

---

## 🔧 Environment Variables

### Backend — `backend/.env`
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGO_URI` | ✅ | MongoDB connection string | `mongodb://localhost:27017/teamflow` |
| `JWT_SECRET` | ✅ | Secret used to sign JWTs | `a_long_random_secret` |
| `PORT` | ➖ | Backend port (default `5000`) | `5000` |
| `NODE_ENV` | ➖ | `development` or `production` | `development` |
| `CLIENT_URL` | ➖ | Extra allowed CORS origin | `https://your-app.com` |

> CORS automatically allows `localhost`, any `*.ngrok*` origin, and `CLIENT_URL`.

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Base URL the frontend calls | `http://localhost:5000/api` (dev) |

`frontend/.env.production` sets `REACT_APP_API_URL=/api` so production builds call the API on the **same origin** as the app.

---

## ▶️ Running the App

### Development (two terminals)
```bash
# Terminal 1 — backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:3000)
cd frontend
npm start
```

The React dev server (port **3000**) talks to the API on port **5000**.

### Production / single origin
```bash
# 1. Build the frontend
cd frontend
npm run build

# 2. Start the backend — it serves the built frontend automatically
cd ../backend
npm run prod        # node server.js
```
Now the entire app is served from **http://localhost:5000**.

---

## 📡 API Reference

Base URL: `/api` — all protected routes require an `Authorization: Bearer <token>` header.

### Auth — `/api/auth`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register a new user |
| POST | `/login` | Public | Log in, returns JWT |
| GET | `/me` | Auth | Current user profile |
| PUT | `/me` | Auth | Update profile |
| GET | `/users` | Auth | List all users |

### Projects — `/api/projects`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Auth | List projects (scoped by role) |
| POST | `/` | Auth | Create project (creator = owner) |
| GET | `/:id` | Auth | Get one project |
| PUT | `/:id` | Owner/Admin | Update project |
| DELETE | `/:id` | Owner/Admin | Delete project (+ its tasks) |
| GET | `/:id/stats` | Auth | Task statistics for a project |

### Tasks — `/api/tasks`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Auth | List tasks (supports filters) |
| POST | `/` | Auth | Create task |
| GET | `/:id` | Auth | Get one task |
| PUT | `/:id` | Auth | Update task |
| DELETE | `/:id` | Auth | Delete task |
| POST | `/:id/comments` | Auth | Add a comment |
| GET | `/blocked` | Auth | List blocked tasks |
| GET | `/stats/dashboard` | Auth | Dashboard statistics |

### Incidents — `/api/incidents`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Auth | List incidents (supports filters) |
| POST | `/` | Auth | Report an incident |
| GET | `/:id` | Auth | Get one incident |
| PUT | `/:id` | Auth | Update / resolve incident |
| DELETE | `/:id` | Auth | Delete incident |
| POST | `/:id/timeline` | Auth | Add a timeline entry |

### Reviews — `/api/reviews`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Auth | List reviews (scoped by role) |
| PUT | `/:id` | Reviewer/Admin | Approve or reject |
| POST | `/:id/reassign` | Auth | Reassign to another reviewer |

### Notifications — `/api/notifications`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Auth | List notifications |
| GET | `/unread-count` | Auth | Unread count |
| PUT | `/mark-all-read` | Auth | Mark all as read |
| PUT | `/:id/read` | Auth | Mark one as read |
| DELETE | `/:id` | Auth | Delete a notification |

### Reports & Health
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/reports` | Auth | Aggregated analytics (filterable) |
| GET | `/api/health` | Public | Health check |

---

## 👥 Roles & Permissions

| Role | Capabilities |
|------|--------------|
| **Admin** | Full access to all projects, tasks, reviews, and incidents |
| **Project Manager** | Manage owned projects; full task & incident workflows |
| **Developer** | Create projects/tasks/incidents; manage own projects; act on assigned reviews |
| **Viewer** | Read-oriented access to team data |

> Project **edit/delete** is always restricted to the project **owner or an admin**, enforced server-side.

---

## 🗃 Data Models

- **User** — name, email, password (hashed), role, avatar, isActive, lastActiveAt
- **Project** — name, description, status, priority, owner, members, dates, tags, progress
- **Task** — title, status, priority, project, assignees, dependencies, reviewer & fallback, comments, due date, hours, tags, blockedReason
- **Incident** — title, description, severity, status, project, investigator, reportedBy, timeline
- **Review** — task, reviewer, fallbackReviewer, requestedBy, status, feedback, reassign metadata
- **Notification** — recipient, type, title, message, isRead, link

---

## 📐 Business Rules

- **Circular dependency protection** — the Task model runs a cycle-detection check before save and rejects any task whose dependencies would form a loop.
- **Reviewer reassignment** — if the assigned reviewer has been inactive for **more than 7 days**, the system recommends the fallback reviewer during reassignment.
- **Review outcome sync** — approving a review sets the task to `done`; rejecting returns it to `in_progress`, and the requester is notified.
- **Cascade delete** — deleting a project also removes its tasks.

---

## 📜 Available Scripts

### Root (`/`)
| Script | Action |
|--------|--------|
| `npm run install:all` | Install backend + frontend dependencies |
| `npm run backend` | Start the backend |
| `npm run frontend` | Start the frontend dev server |

### Backend (`/backend`)
| Script | Action |
|--------|--------|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm run prod` | Start with `node server.js` |

### Frontend (`/frontend`)
| Script | Action |
|--------|--------|
| `npm start` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm test` | Run tests |

---
