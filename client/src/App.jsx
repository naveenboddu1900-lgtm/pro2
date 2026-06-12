import { useMemo, useReducer } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  PanelLeft,
  Plus,
  Search,
  Settings,
  Users
} from "lucide-react";
import { initialKanban, workspace } from "./data.js";
import { createMoveOperation, getBoardMetrics, kanbanReducer } from "./kanbanState.js";

const navItems = [
  { label: "Boards", icon: LayoutDashboard, active: true },
  { label: "Members", icon: Users },
  { label: "Settings", icon: Settings }
];

function Sidebar() {
  return (
    <aside className="sidebar">
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
    </aside>
  );
}

function Topbar() {
  return (
    <header className="topbar">
      <button className="icon-button mobile-only" type="button" aria-label="Open sidebar">
        <PanelLeft size={19} />
      </button>
      <label className="search-box">
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
    <section className="kanban-section" aria-label="Sprint board">
      <div className="section-header">
        <div>
          <h2>Sprint Board</h2>
          <p>Card moves update instantly while confirmation is pending.</p>
        </div>
        <div className="board-metrics" aria-label="Board state">
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
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <div className="kanban-list-header">
                      <h3>{list.title}</h3>
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

function WorkspaceSettings() {
  return (
    <section className="settings-panel" aria-label="Workspace settings">
      <div className="settings-header">
        <div>
          <h2>Workspace Settings</h2>
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
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <Topbar />
        <div className="content">
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
          <KanbanBoard />
          <WorkspaceSettings />
        </div>
      </main>
    </div>
  );
}
