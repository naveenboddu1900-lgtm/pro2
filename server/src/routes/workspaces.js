import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { User, Workspace } from "../models/index.js";

export const workspacesRouter = Router();

workspacesRouter.use(requireAuth);

function serializeWorkspace(workspace) {
  return {
    id: workspace._id,
    name: workspace.name,
    description: workspace.description,
    owner: workspace.owner,
    members: workspace.members,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt
  };
}

workspacesRouter.get("/", async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }]
    }).sort({ updatedAt: -1 });

    res.json({ workspaces: workspaces.map(serializeWorkspace) });
  } catch (error) {
    next(error);
  }
});

workspacesRouter.post("/", async (req, res, next) => {
  try {
    const { name, description = "" } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Workspace name is required" });
    }

    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: "owner"
        }
      ]
    });

    return res.status(201).json({ workspace: serializeWorkspace(workspace) });
  } catch (error) {
    return next(error);
  }
});

workspacesRouter.post("/:workspaceId/invitations", async (req, res, next) => {
  try {
    const { email, role = "member" } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Invitee email is required" });
    }

    if (!["admin", "member", "viewer"].includes(role)) {
      return res.status(400).json({ message: "Role must be admin, member, or viewer" });
    }

    const workspace = await Workspace.findOne({
      _id: req.params.workspaceId,
      $or: [
        { owner: req.user._id },
        { members: { $elemMatch: { user: req.user._id, role: { $in: ["owner", "admin"] } } } }
      ]
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found or access denied" });
    }

    const invitee = await User.findOne({ email: email.toLowerCase().trim() });

    if (!invitee) {
      return res.status(404).json({ message: "Invitee must register before being added" });
    }

    const existingMember = workspace.members.find((member) => member.user.equals(invitee._id));

    if (existingMember) {
      existingMember.role = role;
    } else {
      workspace.members.push({
        user: invitee._id,
        role
      });
    }

    await workspace.save();

    return res.status(existingMember ? 200 : 201).json({
      workspace: serializeWorkspace(workspace),
      invitedUser: {
        id: invitee._id,
        name: invitee.name,
        email: invitee.email
      }
    });
  } catch (error) {
    return next(error);
  }
});
