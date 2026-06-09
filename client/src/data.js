export const workspace = {
  name: "Product Delivery",
  plan: "Team",
  visibility: "Workspace",
  members: 8,
  boards: [
    {
      name: "Sprint Board",
      description: "Current engineering sprint",
      lists: [
        { title: "Backlog", count: 9 },
        { title: "In Progress", count: 4 },
        { title: "Review", count: 3 },
        { title: "Done", count: 12 }
      ]
    },
    {
      name: "Release Readiness",
      description: "Launch blockers and QA checks",
      lists: [
        { title: "Open", count: 5 },
        { title: "Blocked", count: 2 },
        { title: "Ready", count: 7 }
      ]
    }
  ],
  membersList: [
    { name: "Naveen Boddu", role: "Owner", initials: "NB" },
    { name: "Aditi Rao", role: "Admin", initials: "AR" },
    { name: "Kiran Das", role: "Member", initials: "KD" },
    { name: "Maya Shah", role: "Viewer", initials: "MS" }
  ]
};

export const initialKanban = {
  lists: {
    backlog: {
      id: "backlog",
      title: "Backlog",
      cardIds: ["card-1", "card-2", "card-3"]
    },
    progress: {
      id: "progress",
      title: "In Progress",
      cardIds: ["card-4", "card-5"]
    },
    review: {
      id: "review",
      title: "Review",
      cardIds: ["card-6"]
    },
    done: {
      id: "done",
      title: "Done",
      cardIds: ["card-7", "card-8"]
    }
  },
  listOrder: ["backlog", "progress", "review", "done"],
  cards: {
    "card-1": {
      id: "card-1",
      title: "Map workspace permission rules",
      owner: "NB",
      priority: "High",
      points: 5
    },
    "card-2": {
      id: "card-2",
      title: "Design invitation empty states",
      owner: "AR",
      priority: "Medium",
      points: 3
    },
    "card-3": {
      id: "card-3",
      title: "Review board indexing strategy",
      owner: "KD",
      priority: "Low",
      points: 2
    },
    "card-4": {
      id: "card-4",
      title: "Connect list reorder payload",
      owner: "MS",
      priority: "High",
      points: 5
    },
    "card-5": {
      id: "card-5",
      title: "Polish card metadata display",
      owner: "AR",
      priority: "Medium",
      points: 3
    },
    "card-6": {
      id: "card-6",
      title: "Verify card move validation",
      owner: "NB",
      priority: "High",
      points: 8
    },
    "card-7": {
      id: "card-7",
      title: "Create board layout shell",
      owner: "KD",
      priority: "Medium",
      points: 3
    },
    "card-8": {
      id: "card-8",
      title: "Document Week 2 API paths",
      owner: "MS",
      priority: "Low",
      points: 1
    }
  }
};
