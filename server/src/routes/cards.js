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
    comments: card.comments?.filter((comment) => !comment.deletedAt).map(serializeComment) || [],
    archivedAt: card.archivedAt,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt
  };
}

function serializeComment(comment) {
  return {
    id: comment._id,
    author: comment.author,
    body: comment.body,
    editedAt: comment.editedAt,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt
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

cardsRouter.get("/:cardId/comments", async (req, res, next) => {
  try {
    const board = await findAccessibleBoard(req.params.boardId, req.user._id);

    if (!board) {
      return res.status(404).json({ message: "Board not found or access denied" });
    }

    const card = await Card.findOne({ _id: req.params.cardId, board: board._id });

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    const comments = card.comments
      .filter((comment) => !comment.deletedAt)
      .sort((first, second) => first.createdAt - second.createdAt)
      .map(serializeComment);

    return res.json({ comments });
  } catch (error) {
    return next(error);
  }
});

cardsRouter.post("/:cardId/comments", async (req, res, next) => {
  try {
    const { body } = req.body;
    const board = await findEditableBoard(req.params.boardId, req.user._id);

    if (!board) {
      return res.status(404).json({ message: "Board not found or access denied" });
    }

    if (!body || !body.trim()) {
      return res.status(400).json({ message: "Comment body is required" });
    }

    const card = await Card.findOne({ _id: req.params.cardId, board: board._id });

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    card.comments.push({
      author: req.user._id,
      body
    });

    await card.save();

    const comment = serializeComment(card.comments[card.comments.length - 1]);
    const payload = {
      cardId: card._id,
      comment
    };

    emitBoardEvent(req, board._id, "comment:created", payload);

    return res.status(201).json(payload);
  } catch (error) {
    return next(error);
  }
});

cardsRouter.patch("/:cardId/comments/:commentId", async (req, res, next) => {
  try {
    const { body } = req.body;
    const board = await findEditableBoard(req.params.boardId, req.user._id);

    if (!board) {
      return res.status(404).json({ message: "Board not found or access denied" });
    }

    if (!body || !body.trim()) {
      return res.status(400).json({ message: "Comment body is required" });
    }

    const card = await Card.findOne({ _id: req.params.cardId, board: board._id });

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    const comment = card.comments.id(req.params.commentId);

    if (!comment || comment.deletedAt) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({ message: "Only the author can edit this comment" });
    }

    comment.body = body;
    comment.editedAt = new Date();

    await card.save();

    const payload = {
      cardId: card._id,
      comment: serializeComment(comment)
    };

    emitBoardEvent(req, board._id, "comment:updated", payload);

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

cardsRouter.delete("/:cardId/comments/:commentId", async (req, res, next) => {
  try {
    const board = await findEditableBoard(req.params.boardId, req.user._id);

    if (!board) {
      return res.status(404).json({ message: "Board not found or access denied" });
    }

    const card = await Card.findOne({ _id: req.params.cardId, board: board._id });

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    const comment = card.comments.id(req.params.commentId);

    if (!comment || comment.deletedAt) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({ message: "Only the author can delete this comment" });
    }

    comment.deletedAt = new Date();

    await card.save();

    const payload = {
      cardId: card._id,
      commentId: comment._id
    };

    emitBoardEvent(req, board._id, "comment:deleted", payload);

    return res.json(payload);
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
