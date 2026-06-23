import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Board, Workspace } from "../models/index.js";
import { serializeBoard } from "../utils/boardAccess.js";
import { deleteCacheByPrefix, getCache, setCache } from "../cache.js";

export const boardsRouter = Router();

boardsRouter.use(requireAuth);

boardsRouter.get("/", async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }]
    }).select("_id");
    const workspaceIds = workspaces.map((workspace) => workspace._id);
    const cacheKey = `boards:${req.user._id.toString()}`;
    const cachedBoards = await getCache(cacheKey);

    if (cachedBoards) {
      return res.json({ boards: cachedBoards, cached: true });
    }

    const boards = await Board.find({ workspace: { $in: workspaceIds } }).sort({ updatedAt: -1 });
    const serializedBoards = boards.map(serializeBoard);

    await setCache(cacheKey, serializedBoards, 45);

    return res.json({ boards: serializedBoards, cached: false });
  } catch (error) {
    return next(error);
  }
});

boardsRouter.post("/", async (req, res, next) => {
  try {
    const { workspaceId, name, description = "", visibility = "workspace" } = req.body;

    if (!workspaceId || !name) {
      return res.status(400).json({ message: "Workspace id and board name are required" });
    }

    if (!["workspace", "private"].includes(visibility)) {
      return res.status(400).json({ message: "Visibility must be workspace or private" });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [
        { owner: req.user._id },
        { members: { $elemMatch: { user: req.user._id, role: { $in: ["owner", "admin", "member"] } } } }
      ]
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found or access denied" });
    }

    const board = await Board.create({
      workspace: workspace._id,
      name,
      description,
      visibility,
      createdBy: req.user._id
    });

    await deleteCacheByPrefix("boards:");

    return res.status(201).json({ board: serializeBoard(board) });
  } catch (error) {
    return next(error);
  }
});
