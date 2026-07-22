# Team Management System with Role-Based Access Control (RBAC)

## Description

A full-stack MERN application designed to manage **Teams, Users, Roles, and Permissions** using dynamic Role-Based Access Control (RBAC).

Key architectural concepts:
- **Multi-Team Membership**: Users can belong to multiple teams simultaneously.
- **Dynamic Contextual Roles**: A user can hold different roles in different teams (e.g. *Admin* in Team Alpha, *Viewer* in Team Beta).
- **Dynamic Permission Resolution**: Permissions are never hardcoded (e.g. `if(role === 'admin')`). Instead, a user's permissions are dynamically resolved from their assigned role within a specific team down to granular permission strings.
- **Middleware-Driven Authorization**: Reusable Express middleware (`requirePermission`) intercepts incoming API calls and enforces authorization checks dynamically based on resolved permissions.

---

## Features

- **Authentication**: JWT authentication, bcrypt password hashing, and client/server protected routes.
- **Teams**: Create, view, update, and delete teams.
- **Users**: User creation, listing, and real-time filtering/search by name or email.
- **Roles**: Pre-seeded default roles (*Admin*, *Manager*, *Viewer*) and dynamic role creation.
- **Permissions**: Granular permission keys (`CREATE_TASK`, `EDIT_TASK`, `DELETE_TASK`, `VIEW_ONLY`, `CREATE_TEAM`, `MANAGE_MEMBERS`, `ASSIGN_ROLE`, `DELETE_TEAM`).
- **Dynamic Permission Resolution**: Real-time permission evaluation based on user-team-role context.
- **Permission Viewer**: Visual tool to inspect active permissions for any user across any team.
- **Dashboard**: Real-time project metrics, task status breakdown, overdue task alerts, and user task distribution charts powered by Recharts.
- **Task Management**: Full Kanban board with task creation, assignment, status tracking, and priority tagging.
- **Role Assignment**: In-team member management allowing real-time role updates.

---

## Tech Stack

### Frontend
- **React** (v19)
- **Vite** (Build Tool)
- **Axios** (HTTP Client)
- **React Router** (Client Routing)
- **Recharts** (Data Visualization)

### Backend
- **Node.js** & **Express**
- **MongoDB** & **Mongoose** (ODM)
- **JSON Web Token (JWT)** (Authentication)
- **bcryptjs** (Password Hashing)

---

## Database Design

The system uses 6 Mongoose collections designed with proper relational references:

1. **User**: Stores system user profiles (`name`, `email` [unique], `password`, `createdAt`, `updatedAt`).
2. **Team**: Represents collaborative groups/teams (`name`, `description`, `createdBy` [ref User], `createdAt`, `updatedAt`).
3. **Permission**: Stores granular system permissions (`name` [unique], e.g., `CREATE_TASK`, `EDIT_TASK`).
4. **Role**: Defines roles and maps them to permissions (`name`, `permissions` [Array of ref Permission]).
5. **TeamMember**: **Core mapping collection** (`team` [ref Team], `user` [ref User], `role` [ref Role]). Implements compound unique index `{ team: 1, user: 1 }` allowing users to have distinct roles per team.
6. **Task**: Represents tasks assigned within a team (`team` [ref Team], `title`, `description`, `dueDate`, `priority`, `status`, `assignedTo` [ref User], `createdBy` [ref User]).

### Relationships Diagram

```
[User] ─── (1:N) ─── [TeamMember] ─── (N:1) ─── [Team]
                          │
                       (N:1)
                          │
                        [Role] ─── (N:M) ─── [Permission]
```

---

## Architecture

Request authorization flow:

```
Client (React App)
       │ (Sends HTTP Header: Authorization: Bearer <JWT>)
       ▼
JWT Authentication Middleware (Verifies user token & attaches req.user)
       │
       ▼
Express Route Handler
       │
       ▼
RBAC Middleware (requirePermission)
  ├─ 1. Resolves teamId from request context
  ├─ 2. Queries TeamMember for (teamId, userId)
  ├─ 3. Populates Role -> Permissions
  └─ 4. Checks if required permission exists (Allow or Deny 403)
       │
       ▼
MongoDB Database Execution
```

---

## API Documentation

### Authentication
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register new user | No |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |

### Users
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users` | List users (supports `?search=term`) | Yes |
| `POST` | `/api/users` | Create user profile | Yes |

### Teams
| Method | Endpoint | Description | Auth Required | Permission Required |
|---|---|---|---|---|
| `GET` | `/api/teams` | List current user's teams | Yes | - |
| `POST` | `/api/teams` | Create new team | Yes | - |
| `GET` | `/api/teams/:id` | Fetch team details & members | Yes | Member of team |
| `DELETE` | `/api/teams/:id` | Delete team | Yes | `DELETE_TEAM` |

### Membership & Role Assignment
| Method | Endpoint | Description | Auth Required | Permission Required |
|---|---|---|---|---|
| `POST` | `/api/teams/:id/members` | Add member to team | Yes | `MANAGE_MEMBERS` |
| `DELETE` | `/api/teams/:id/members/:userId` | Remove member from team | Yes | `MANAGE_MEMBERS` |
| `PUT` | `/api/teams/:teamId/users/:userId/role` | Change user role in team | Yes | `ASSIGN_ROLE` |
| `GET` | `/api/teams/:teamId/users/:userId/permissions` | Resolve active user permissions | Yes | - |

### Roles
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/roles` | List all roles with permissions | Yes |
| `POST` | `/api/roles` | Create new role | Yes |
| `PUT` | `/api/roles/:id/permissions` | Update permissions assigned to role | Yes |

### Permissions
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/permissions` | List all system permissions | Yes |
| `POST` | `/api/permissions` | Create new permission key | Yes |

### Tasks
| Method | Endpoint | Description | Auth Required | Permission Required |
|---|---|---|---|---|
| `GET` | `/api/tasks?team_id=X` | List tasks in team | Yes | Member of team |
| `POST` | `/api/tasks` | Create task | Yes | `CREATE_TASK` |
| `PATCH` | `/api/tasks/:id` | Update task status or details | Yes | `EDIT_TASK` (or assignee status update) |
| `DELETE` | `/api/tasks/:id` | Delete task | Yes | `DELETE_TASK` |

### Dashboard
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/dashboard` | Global metrics across user's teams | Yes |
| `GET` | `/api/dashboard?team_id=X` | Team-specific metrics & task breakdown | Yes |

---

## Project Structure

```
.
├── backend
│   ├── models
│   │   ├── User.js
│   │   ├── Team.js
│   │   ├── Role.js
│   │   ├── Permission.js
│   │   ├── TeamMember.js
│   │   └── Task.js
│   ├── middleware
│   │   ├── auth.js
│   │   └── rbac.js
│   ├── routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── teams.js
│   │   ├── roles.js
│   │   ├── permissions.js
│   │   ├── tasks.js
│   │   └── dashboard.js
│   ├── database.js
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── .env.example
├── frontend
│   ├── src
│   │   ├── components
│   │   │   └── Layout.jsx
│   │   ├── context
│   │   │   └── AuthContext.jsx
│   │   ├── pages
│   │   │   ├── AuthPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Teams.jsx
│   │   │   ├── TeamDetail.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── Roles.jsx
│   │   │   ├── Permissions.jsx
│   │   │   ├── PermissionViewer.jsx
│   │   │   └── MyTasks.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Getting Started

### Installation
```bash
# Install dependencies for backend and frontend
npm run install:all
```

### Environment Configuration
Copy `backend/.env.example` to `backend/.env` and update configuration:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/taskmanager
JWT_SECRET=super-secret-key
PORT=5000
NODE_ENV=development
```

### Running Locally
```bash
# Start backend server
npm run dev:backend

# Start frontend application
npm run dev:frontend
```
