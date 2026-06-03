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
