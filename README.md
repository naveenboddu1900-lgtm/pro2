# Pro2 - Real-Time Collaborative Workspace

Week 1 Day 1-2 implementation for **Project 2: Real-Time Collaborative Workspace (Agile Management Tool)**.

This checkpoint only defines the core data foundation:

- Users
- Workspaces
- Boards
- Lists
- Cards

Later timeline items such as authentication, workspace invitations, Kanban APIs, drag-and-drop, Socket.io synchronization, Redis caching, search, and notifications are intentionally not implemented yet.

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

## Validation

```bash
npm run check
```

This verifies JavaScript syntax for the Week 1 Day 1-2 source files.
