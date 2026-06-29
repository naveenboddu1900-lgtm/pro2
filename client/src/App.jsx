import { useMemo, useReducer, useRef, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  Bell,
  ChevronDown,
  Radio,
  LayoutDashboard,
  PanelLeft,
  Plus,
  Search,
  Settings,
  Users
} from "lucide-react";
import { initialKanban, workspace } from "./data.js";
import { createMoveOperation, getBoardMetrics, kanbanReducer } from "./kanbanState.js";
import { apiUrl, getHealth, getNotifications, loginUser, registerUser, searchWorkspace } from "./apiClient.js";
import { bindBoardSocketEvents, createWorkspaceSocket, socketUrl } from "./socketClient.js";

const navItems = [
  { label: "Boards", icon: LayoutDashboard, active: true },
  { label: "Members", icon: Users },
  { label: "Settings", icon: Settings }
];

function Sidebar({ isOpen = false, onClose }) {
  return (
    <aside className={isOpen ? "sidebar is-open" : "sidebar"} aria-label="Primary navigation">
      <div className="brand-row">
        <div className="brand-mark">P2</div>
        <div>
          <p className="brand-name">Pro2</p>
          <p className="muted">Agile workspace</p>
        </div>
      </div>

      <button className="workspace-switcher" type="button">
        <span>{workspace.name}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      <nav className="nav-list" aria-label="Workspace">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <button className={item.active ? "nav-item active" : "nav-item"} key={item.label} type="button">
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button className="secondary-button mobile-close" type="button" onClick={onClose}>Close menu</button>
    </aside>
  );
}

function Topbar({ onOpenSidebar }) {
  return (
    <header className="topbar">
      <button className="icon-button mobile-only" type="button" aria-label="Open sidebar" onClick={onOpenSidebar}>
        <PanelLeft size={19} />
      </button>
      <label className="search-box">
        <span className="sr-only">Search boards, cards, and members</span>
        <Search size={17} aria-hidden="true" />
        <input placeholder="Search boards, cards, members" />
      </label>
      <div className="topbar-actions">
        <button className="icon-button" type="button" aria-label="Notifications">
          <Bell size={19} />
        </button>
        <button className="primary-button" type="button">
          <Plus size={17} aria-hidden="true" />
          <span>New board</span>
        </button>
      </div>
    </header>
  );
}

function formatSyncTime(value) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function KanbanBoard() {
  const [kanban, dispatch] = useReducer(kanbanReducer, initialKanban);
  const metrics = useMemo(() => getBoardMetrics(kanban), [kanban]);
  const syncLabel = kanban.pendingOperations.length > 0 ? "Sync pending" : `Synced ${formatSyncTime(kanban.lastSyncedAt)}`;

  function confirmMove(operationId) {
    window.setTimeout(() => {
      dispatch({ type: "confirm-move", operationId });
    }, 450);
  }

  function handleDragEnd(result) {
    const { destination, source } = result;

    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const operation = createMoveOperation(result);

    dispatch({
      type: "optimistic-move",
      operation
    });
    confirmMove(operation.id);
  }

  return (
    <section className="kanban-section" aria-labelledby="sprint-board-heading">
      <div className="section-header">
        <div>
          <h2 id="sprint-board-heading">Sprint Board</h2>
          <p>Card moves update instantly while confirmation is pending.</p>
        </div>
        <div className="board-metrics" aria-label="Board state" aria-live="polite">
          <span>{metrics.totalCards} cards</span>
          <span>{metrics.totalPoints} pts</span>
          <span className={kanban.pendingOperations.length > 0 ? "sync-chip pending" : "sync-chip"}>{syncLabel}</span>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {kanban.listOrder.map((listId) => {
            const list = kanban.lists[listId];

            return (
              <Droppable droppableId={list.id} key={list.id}>
                {(provided, snapshot) => (
                  <article
                    className={snapshot.isDraggingOver ? "kanban-list is-over" : "kanban-list"}
                    aria-labelledby={`${list.id}-heading`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <div className="kanban-list-header">
                      <h3 id={`${list.id}-heading`}>{list.title}</h3>
                      <span>{list.cardIds.length}</span>
                    </div>

                    <div className="kanban-cards">
                      {list.cardIds.map((cardId, index) => {
                        const card = kanban.cards[cardId];
                        const isPending = kanban.pendingOperations.some((operation) => operation.cardId === card.id);

                        return (
                          <Draggable draggableId={card.id} index={index} key={card.id}>
                            {(cardProvided, cardSnapshot) => (
                              <div
                                className={[
                                  "task-card",
                                  cardSnapshot.isDragging ? "is-dragging" : "",
                                  isPending ? "is-pending" : ""
                                ].filter(Boolean).join(" ")}
                                aria-label={`${card.title}, ${card.priority} priority, ${card.points} points, assigned to ${card.owner}`}
                                ref={cardProvided.innerRef}
                                {...cardProvided.draggableProps}
                                {...cardProvided.dragHandleProps}
                              >
                                <strong>{card.title}</strong>
                                <div className="card-meta">
                                  <span>{card.priority}</span>
                                  <span>{card.points} pts</span>
                                  <span>{card.owner}</span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  </article>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </section>
  );
}

function ApiWorkspacePanel({ authToken, onAuthToken }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "Naveen Boddu",
    email: "naveen@example.com",
    password: "password123"
  });
  const [query, setQuery] = useState("board");
  const [status, setStatus] = useState("Ready");
  const [payload, setPayload] = useState(null);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function runAction(action) {
    try {
      setStatus("Loading...");
      const result = await action();
      setPayload(result);
      setStatus("Done");
      return result;
    } catch (error) {
      setPayload({ message: error.message });
      setStatus("Error");
      return null;
    }
  }

  async function submitAuth() {
    const action = mode === "login" ? loginUser : registerUser;
    const result = await runAction(() => action(form));

    if (result?.token) {
      onAuthToken(result.token);
    }
  }

  return (
    <section className="api-panel" aria-labelledby="backend-api-heading">
      <div className="section-header">
        <div>
          <h2 id="backend-api-heading">Backend API</h2>
          <p>{apiUrl}</p>
        </div>
        <span className={status === "Error" ? "sync-chip pending" : "sync-chip"} role="status" aria-live="polite">{status}</span>
      </div>

      <div className="segmented-control" aria-label="Auth mode">
        <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>Login</button>
        <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>Register</button>
      </div>

      <div className="api-grid">
        {mode === "register" && (
          <label className="field">
          <span>Name</span>
            <input autoComplete="name" value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input autoComplete="email" type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} />
        </label>
        <label className="field">
          <span>Password</span>
          <input autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" value={form.password} onChange={(event) => updateForm("password", event.target.value)} />
        </label>
      </div>

      <div className="socket-actions">
        <button className="primary-button" type="button" onClick={submitAuth}>{mode === "login" ? "Login" : "Register"}</button>
        <button className="secondary-button" type="button" onClick={() => runAction(getHealth)}>Health</button>
        <button className="secondary-button" type="button" onClick={() => runAction(() => getNotifications(authToken))} disabled={!authToken}>
          Notifications
        </button>
      </div>

      <div className="api-search-row">
        <label className="field">
          <span>Search</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <button className="secondary-button" type="button" onClick={() => runAction(() => searchWorkspace(query, authToken))} disabled={!authToken}>
          Search
        </button>
      </div>

      <div className="event-log">
        <div className="event-row">
          <strong>{authToken ? "Token ready" : "No token"}</strong>
          <code aria-live="polite">{payload ? JSON.stringify(payload) : "Run an API action to see the response."}</code>
        </div>
      </div>
    </section>
  );
}

function RealtimeSocketPanel({ authToken }) {
  const socketRef = useRef(null);
  const cleanupRef = useRef(null);
  const [token, setToken] = useState(authToken);
  const [boardId, setBoardId] = useState("");
  const [status, setStatus] = useState("Disconnected");
  const [events, setEvents] = useState([]);

  function addEvent(event) {
    setEvents((current) => [event, ...current].slice(0, 8));
  }

  function connectSocket() {
    const selectedToken = (token || authToken || "").trim();

    if (!selectedToken) {
      setStatus("Token required");
      return;
    }

    cleanupRef.current?.();
    socketRef.current?.disconnect();

    const socket = createWorkspaceSocket(selectedToken);
    cleanupRef.current = bindBoardSocketEvents(socket, addEvent);
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus(`Connected ${socket.id}`);
    });

    socket.on("disconnect", (reason) => {
      setStatus(`Disconnected: ${reason}`);
    });

    socket.connect();
    setStatus("Connecting...");
  }

  function joinBoardRoom() {
    if (!socketRef.current?.connected || !boardId.trim()) {
      setStatus("Connect and enter a board id");
      return;
    }

    socketRef.current.emit("board:join", boardId.trim(), (response) => {
      addEvent({
        name: "board:join:ack",
        payload: response,
        receivedAt: new Date().toISOString()
      });
    });
  }

  function sendTypingProbe(eventName) {
    if (!socketRef.current?.connected || !boardId.trim()) {
      setStatus("Connect and enter a board id");
      return;
    }

    socketRef.current.emit(eventName, { boardId: boardId.trim(), cardId: "demo-card" }, (response) => {
      addEvent({
        name: `${eventName}:ack`,
        payload: response,
        receivedAt: new Date().toISOString()
      });
    });
  }

  return (
    <section className="realtime-panel" aria-labelledby="socket-heading">
      <div className="section-header">
        <div>
          <h2 id="socket-heading">Socket.IO</h2>
          <p>{socketUrl}</p>
        </div>
        <span className={status.startsWith("Connected") ? "sync-chip" : "sync-chip pending"} role="status" aria-live="polite">{status}</span>
      </div>

      <div className="socket-grid">
        <label className="field">
          <span>Auth token</span>
          <input value={token || authToken} onChange={(event) => setToken(event.target.value)} placeholder="Login token fills here" />
        </label>
        <label className="field">
          <span>Board id</span>
          <input value={boardId} onChange={(event) => setBoardId(event.target.value)} placeholder="Mongo board id" />
        </label>
      </div>

      <div className="socket-actions">
        <button className="primary-button" type="button" onClick={connectSocket}>
          <Radio size={17} aria-hidden="true" />
          <span>Connect</span>
        </button>
        <button className="secondary-button" type="button" onClick={joinBoardRoom}>Join board</button>
        <button className="secondary-button" type="button" onClick={() => sendTypingProbe("comment:typing-started")}>
          Typing start
        </button>
        <button className="secondary-button" type="button" onClick={() => sendTypingProbe("comment:typing-stopped")}>
          Typing stop
        </button>
      </div>

      <div className="event-log" aria-live="polite">
        {events.length === 0 ? (
          <p>No socket events yet.</p>
        ) : (
          events.map((event) => (
            <div className="event-row" key={`${event.name}-${event.receivedAt}`}>
              <strong>{event.name}</strong>
              <code>{JSON.stringify(event.payload)}</code>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function WorkspaceSettings() {
  return (
    <section className="settings-panel" aria-labelledby="workspace-settings-heading">
      <div className="settings-header">
        <div>
          <h2 id="workspace-settings-heading">Workspace Settings</h2>
          <p>{workspace.members} members - {workspace.visibility} visibility - {workspace.plan} plan</p>
        </div>
        <button className="secondary-button" type="button">Save changes</button>
      </div>

      <div className="settings-grid">
        <label className="field">
          <span>Name</span>
          <input defaultValue={workspace.name} />
        </label>
        <label className="field">
          <span>Default role</span>
          <select defaultValue="Member">
            <option>Admin</option>
            <option>Member</option>
            <option>Viewer</option>
          </select>
        </label>
        <label className="toggle-row">
          <input type="checkbox" defaultChecked />
          <span>Require approval for new invitations</span>
        </label>
        <label className="toggle-row">
          <input type="checkbox" />
          <span>Allow viewers to comment on cards</span>
        </label>
      </div>

      <div className="member-list">
        {workspace.membersList.map((member) => (
          <div className="member-row" key={member.name}>
            <div className="avatar">{member.initials}</div>
            <div>
              <strong>{member.name}</strong>
              <span>{member.role}</span>
            </div>
            <button className="text-button" type="button">Manage</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function App() {
  const [authToken, setAuthToken] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      {isSidebarOpen && <button className="sidebar-backdrop" type="button" aria-label="Close sidebar" onClick={() => setIsSidebarOpen(false)} />}
      <main className="main-area" id="main-content" tabIndex="-1">
        <Topbar onOpenSidebar={() => setIsSidebarOpen(true)} />
        <div className="content" aria-label="Workspace dashboard">
          <section className="workspace-heading">
            <div>
              <p className="eyebrow">Week 2 - Day 7</p>
              <h1>{workspace.name}</h1>
            </div>
            <div className="status-pills" aria-label="Workspace summary">
              <span>{workspace.members} members</span>
              <span>{initialKanban.listOrder.length} lists</span>
            </div>
          </section>
          <ApiWorkspacePanel authToken={authToken} onAuthToken={setAuthToken} />
          <KanbanBoard />
          <RealtimeSocketPanel authToken={authToken} />
          <WorkspaceSettings />
        </div>
      </main>
    </div>
  );
}
