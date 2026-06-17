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

### Day 6-7

Built the initial frontend workspace experience:

- React/Vite client scaffold
- Sidebar navigation
- Workspace switcher
- Board overview layout
- Workspace settings panel
- Member management list
- Responsive mobile layout

Later timeline items such as Kanban list/card CRUD, drag-and-drop, Socket.io synchronization, Redis caching, search, and notifications are intentionally not implemented yet.

### Week 2 Day 1-3

Implemented the first Kanban REST API layer:

- Board creation and listing
- List create, read, update, and archive
- Card create, read, update, move between lists, and archive
- Workspace membership checks for board/list/card access

### Week 2 Day 4-6

Implemented the frontend Kanban interaction layer:

- Maintained React state for board lists and cards
- Drag-and-drop card reordering inside the same list
- Drag-and-drop card movement across lists
- Visual drop targets and dragging states
- Stable responsive board columns

### Week 2 Day 7

Optimized local UI state before server confirmation:

- Reducer-based Kanban state updates
- Optimistic card move operations
- Pending move status indicators
- Derived board metrics for card count and points
- Simulated server confirmation path for future API integration

### Week 3 Day 1-2

Started real-time synchronization infrastructure:

- Socket.io server attached to the HTTP server
- JWT-style authenticated WebSocket handshakes
- Safe connection and disconnection tracking
- Board room join and leave events
- Presence events for board collaboration rooms

### Week 3 Day 3-5

Broadcasted board-specific card changes:

- Card creation events to connected board-room users
- Card movement events when list or position changes
- Card update events for non-movement edits
- Card archive events after soft deletion
- Shared realtime event names for frontend listeners

Typing indicators, comment threads, Redis caching, search, and notifications are intentionally not implemented yet.

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.io

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

Run the frontend:

```bash
npm run client:dev
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

### Board, List, and Card Endpoints

```text
GET /api/boards
POST /api/boards
GET /api/boards/:boardId/lists
POST /api/boards/:boardId/lists
PATCH /api/boards/:boardId/lists/:listId
DELETE /api/boards/:boardId/lists/:listId
GET /api/boards/:boardId/cards
POST /api/boards/:boardId/cards
PATCH /api/boards/:boardId/cards/:cardId
DELETE /api/boards/:boardId/cards/:cardId
```

## Validation

```bash
npm run check
```

This verifies JavaScript syntax for the backend source files.
