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
import { workspace } from "./data.js";

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

function BoardPreview() {
  return (
    <section className="board-grid" aria-label="Boards">
      {workspace.boards.map((board) => (
        <article className="board-card" key={board.name}>
          <div>
            <h2>{board.name}</h2>
            <p>{board.description}</p>
          </div>
          <div className="list-strip">
            {board.lists.map((list) => (
              <div className="list-tile" key={list.title}>
                <span>{list.title}</span>
                <strong>{list.count}</strong>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

function WorkspaceSettings() {
  return (
    <section className="settings-panel" aria-label="Workspace settings">
      <div className="settings-header">
        <div>
          <h2>Workspace Settings</h2>
          <p>{workspace.members} members · {workspace.visibility} visibility · {workspace.plan} plan</p>
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
              <p className="eyebrow">Week 1 · Day 6-7</p>
              <h1>{workspace.name}</h1>
            </div>
            <div className="status-pills" aria-label="Workspace summary">
              <span>{workspace.members} members</span>
              <span>{workspace.boards.length} boards</span>
            </div>
          </section>
          <BoardPreview />
          <WorkspaceSettings />
        </div>
      </main>
    </div>
  );
}
