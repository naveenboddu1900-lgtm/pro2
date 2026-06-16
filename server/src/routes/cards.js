import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Card, List } from "../models/index.js";
import { findAccessibleBoard, findEditableBoard } from "../utils/boardAccess.js";
import { emitBoardEvent } from "../utils/realtime.js";

export const cardsRouter = Router({ mergeParams: true });

cardsRouter.use(requireAuth);

function serializeCard(card) {
  return {
    id: card._id,
    board: card.board,
    list: card.list,
    title: card.title,
    description: card.description,
    position: card.position,
    labels: card.labels,
    assignees: card.assignees,
    dueDate: card.dueDate,
    checklist: card.checklist,
    archivedAt: card.archivedAt,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt
  };
}

function getChangedFields(updates) {
  return Object.keys(updates).filter((field) => updates[field] !== undefined);
}

cardsRouter.get("/", async (req, res, next) => {
  try {
    const board = await findAccessibleBoard(req.params.boardId, req.user._id);

    if (!board) {
      return res.status(404).json({ message: "Board not found or access denied" });
    }

    const query = { board: board._id, archivedAt: null };

    if (req.query.listId) {
      query.list = req.query.listId;
    }

    const cards = await Card.find(query).sort({ list: 1, position: 1 });

    return res.json({ cards: cards.map(serializeCard) });
  } catch (error) {
    return next(error);
  }
});

cardsRouter.post("/", async (req, res, next) => {
  try {
    const { listId, title, description = "", labels = [], assignees = [], dueDate = null, checklist = [], position } = req.body;
    const board = await findEditableBoard(req.params.boardId, req.user._id);

    if (!board) {
      return res.status(404).json({ message: "Board not found or access denied" });
    }

    if (!listId || !title) {
      return res.status(400).json({ message: "List id and card title are required" });
    }

    const list = await List.findOne({ _id: listId, board: board._id, archivedAt: null });

    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    const nextPosition = await Card.countDocuments({ board: board._id, list: list._id, archivedAt: null });
    const card = await Card.create({
      board: board._id,
      list: list._id,
      title,
      description,
      labels,
      assignees,
      dueDate,
      checklist,
      position: Number.isInteger(position) ? position : nextPosition
    });

    const payload = { card: serializeCard(card) };
    emitBoardEvent(req, board._id, "card:created", payload);

    return res.status(201).json(payload);
  } catch (error) {
    return next(error);
  }
});

cardsRouter.patch("/:cardId", async (req, res, next) => {
  try {
    const board = await findEditableBoard(req.params.boardId, req.user._id);

    if (!board) {
      return res.status(404).json({ message: "Board not found or access denied" });
    }

    const updates = {};
    const allowedFields = ["title", "description", "position", "labels", "assignees", "dueDate", "checklist"];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const previousCard = await Card.findOne({ _id: req.params.cardId, board: board._id });

    if (!previousCard) {
      return res.status(404).json({ message: "Card not found" });
    }

    if (req.body.listId !== undefined) {
      const targetList = await List.findOne({ _id: req.body.listId, board: board._id, archivedAt: null });

      if (!targetList) {
        return res.status(404).json({ message: "Target list not found" });
      }

      updates.list = targetList._id;
    }

    const card = await Card.findOneAndUpdate(
      { _id: req.params.cardId, board: board._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    const payload = {
      card: serializeCard(card),
      previousList: previousCard.list,
      changedFields: getChangedFields(updates)
    };
    const eventName = updates.list !== undefined || updates.position !== undefined ? "card:moved" : "card:updated";

    emitBoardEvent(req, board._id, eventName, payload);

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

cardsRouter.delete("/:cardId", async (req, res, next) => {
  try {
    const board = await findEditableBoard(req.params.boardId, req.user._id);

    if (!board) {
      return res.status(404).json({ message: "Board not found or access denied" });
    }

    const card = await Card.findOneAndUpdate(
      { _id: req.params.cardId, board: board._id },
      { archivedAt: new Date() },
      { new: true }
    );

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    const payload = { card: serializeCard(card) };
    emitBoardEvent(req, board._id, "card:archived", payload);

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});
