# Pro2 - Real-Time Collaborative Workspace

Week 1 implementation for **Project 2: Real-Time Collaborative Workspace (Agile Management Tool)**.

## Completed Scope

### Day 1-2

Defined the core data foundation:

- Users
- Workspaces
- Boards
- Lists
- Cards

### Day 2-3

Started the authentication and workspace workflow:

- User registration
- User login
- JWT-style signed session token
- Authenticated profile endpoint
- Workspace creation
- Workspace listing for the signed-in user
- Workspace invitation by existing user email

Later timeline items such as Kanban list/card CRUD, drag-and-drop, Socket.io synchronization, Redis caching, search, and notifications are intentionally not implemented yet.

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose

## Data Hierarchy

```text
User
Workspace
  Board
    List
      Card
```

Users can own workspaces, belong to workspace member lists, and be assigned to cards. Boards belong to workspaces, lists belong to boards, and cards belong to lists.

## Getting Started

```bash
npm install
copy .env.example .env
npm run dev
```

The server exposes a health endpoint at:

```text
GET /health
```

### Auth Endpoints

```text
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

### Workspace Endpoints

```text
GET /api/workspaces
POST /api/workspaces
POST /api/workspaces/:workspaceId/invitations
```

## Validation

```bash
npm run check
```

This verifies JavaScript syntax for the Week 1 Day 1-2 source files.
