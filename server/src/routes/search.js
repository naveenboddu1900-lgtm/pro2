import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Board, Card, List, Workspace } from "../models/index.js";

export const searchRouter = Router();

searchRouter.use(requireAuth);

function sanitizeQuery(value) {
  return String(value || "").trim().slice(0, 80);
}

function toRegex(value) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

searchRouter.get("/", async (req, res, next) => {
  try {
    const q = sanitizeQuery(req.query.q);

    if (q.length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    const workspaces = await Workspace.find({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }]
    }).select("_id name");
    const workspaceIds = workspaces.map((workspace) => workspace._id);
    const matcher = toRegex(q);
    const boards = await Board.find({
      workspace: { $in: workspaceIds },
      $or: [{ name: matcher }, { description: matcher }]
    }).limit(20);
    const boardIds = boards.map((board) => board._id);
    const allAccessibleBoards = await Board.find({ workspace: { $in: workspaceIds } }).select("_id");
    const accessibleBoardIds = allAccessibleBoards.map((board) => board._id);
    const lists = await List.find({
      board: { $in: accessibleBoardIds },
      title: matcher,
      archivedAt: null
    }).limit(20);
    const cards = await Card.find({
      board: { $in: accessibleBoardIds },
      archivedAt: null,
      $or: [{ title: matcher }, { description: matcher }, { labels: matcher }]
    }).limit(30);

    return res.json({
      query: q,
      results: {
        workspaces: workspaces
          .filter((workspace) => matcher.test(workspace.name))
          .map((workspace) => ({ id: workspace._id, name: workspace.name })),
        boards: boards.map((board) => ({
          id: board._id,
          workspace: board.workspace,
          name: board.name,
          description: board.description
        })),
        lists: lists.map((list) => ({
          id: list._id,
          board: list.board,
          title: list.title,
          position: list.position
        })),
        cards: cards.map((card) => ({
          id: card._id,
          board: card.board,
          list: card.list,
          title: card.title,
          description: card.description,
          labels: card.labels
        }))
      },
      counts: {
        boards: boardIds.length,
        lists: lists.length,
        cards: cards.length
      }
    });
  } catch (error) {
    return next(error);
  }
});
