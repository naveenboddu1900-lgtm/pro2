import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Card, List } from "../models/index.js";
import { findAccessibleBoard, findEditableBoard } from "../utils/boardAccess.js";

export const listsRouter = Router({ mergeParams: true });

listsRouter.use(requireAuth);

function serializeList(list) {
  return {
    id: list._id,
    board: list.board,
    title: list.title,
    position: list.position,
    archivedAt: list.archivedAt,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt
  };
}

listsRouter.get("/", async (req, res, next) => {
  try {
    const board = await findAccessibleBoard(req.params.boardId, req.user._id);

    if (!board) {
      return res.status(404).json({ message: "Board not found or access denied" });
    }

    const lists = await List.find({ board: board._id, archivedAt: null }).sort({ position: 1 });

    return res.json({ lists: lists.map(serializeList) });
  } catch (error) {
    return next(error);
  }
});

listsRouter.post("/", async (req, res, next) => {
  try {
    const { title, position } = req.body;
    const board = await findEditableBoard(req.params.boardId, req.user._id);

    if (!board) {
      return res.status(404).json({ message: "Board not found or access denied" });
    }

    if (!title) {
      return res.status(400).json({ message: "List title is required" });
    }

    const nextPosition = await List.countDocuments({ board: board._id, archivedAt: null });
    const list = await List.create({
      board: board._id,
      title,
      position: Number.isInteger(position) ? position : nextPosition
    });

    return res.status(201).json({ list: serializeList(list) });
  } catch (error) {
    return next(error);
  }
});

listsRouter.patch("/:listId", async (req, res, next) => {
  try {
    const board = await findEditableBoard(req.params.boardId, req.user._id);

    if (!board) {
      return res.status(404).json({ message: "Board not found or access denied" });
    }

    const updates = {};

    if (req.body.title !== undefined) {
      updates.title = req.body.title;
    }

    if (req.body.position !== undefined) {
      updates.position = req.body.position;
    }

    const list = await List.findOneAndUpdate(
      { _id: req.params.listId, board: board._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    return res.json({ list: serializeList(list) });
  } catch (error) {
    return next(error);
  }
});

listsRouter.delete("/:listId", async (req, res, next) => {
  try {
    const board = await findEditableBoard(req.params.boardId, req.user._id);

    if (!board) {
      return res.status(404).json({ message: "Board not found or access denied" });
    }

    const list = await List.findOneAndUpdate(
      { _id: req.params.listId, board: board._id },
      { archivedAt: new Date() },
      { new: true }
    );

    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    await Card.updateMany({ list: list._id, board: board._id }, { archivedAt: new Date() });

    return res.json({ list: serializeList(list) });
  } catch (error) {
    return next(error);
  }
});
