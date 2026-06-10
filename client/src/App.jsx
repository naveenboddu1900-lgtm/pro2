import { useState } from "react";
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

function reorderList(list, startIndex, endIndex) {
  const nextCardIds = Array.from(list.cardIds);
  const [movedCard] = nextCardIds.splice(startIndex, 1);
  nextCardIds.splice(endIndex, 0, movedCard);

  return {
    ...list,
    cardIds: nextCardIds
  };
}

function moveCard(sourceList, destinationList, source, destination) {
  const sourceCardIds = Array.from(sourceList.cardIds);
  const destinationCardIds = Array.from(destinationList.cardIds);
  const [movedCard] = sourceCardIds.splice(source.index, 1);

  destinationCardIds.splice(destination.index, 0, movedCard);

  return {
    [sourceList.id]: {
      ...sourceList,
      cardIds: sourceCardIds
    },
    [destinationList.id]: {
      ...destinationList,
      cardIds: destinationCardIds
    }
  };
}

function KanbanBoard() {
  const [kanban, setKanban] = useState(initialKanban);

  function handleDragEnd(result) {
    const { destination, source } = result;

    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    setKanban((current) => {
      const sourceList = current.lists[source.droppableId];
      const destinationList = current.lists[destination.droppableId];

      if (sourceList === destinationList) {
        return {
          ...current,
          lists: {
            ...current.lists,
            [sourceList.id]: reorderList(sourceList, source.index, destination.index)
          }
        };
      }

      return {
        ...current,
        lists: {
          ...current.lists,
          ...moveCard(sourceList, destinationList, source, destination)
        }
      };
    });
  }

  return (
    <section className="kanban-section" aria-label="Sprint board">
      <div className="section-header">
        <div>
          <h2>Sprint Board</h2>
          <p>Cards can be reordered inside a list or moved across workflow columns.</p>
        </div>
        <span className="sync-chip">Local state</span>
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

                        return (
                          <Draggable draggableId={card.id} index={index} key={card.id}>
                            {(cardProvided, cardSnapshot) => (
                              <div
                                className={cardSnapshot.isDragging ? "task-card is-dragging" : "task-card"}
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
              <p className="eyebrow">Week 2 - Day 4-6</p>
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
