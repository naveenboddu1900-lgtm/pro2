import { Board, Workspace } from "../models/index.js";

export async function findAccessibleBoard(boardId, userId) {
  const board = await Board.findById(boardId);

  if (!board) {
    return null;
  }

  const workspace = await Workspace.findOne({
    _id: board.workspace,
    $or: [{ owner: userId }, { "members.user": userId }]
  });

  if (!workspace) {
    return null;
  }

  return board;
}

export async function findEditableBoard(boardId, userId) {
  const board = await Board.findById(boardId);

  if (!board) {
    return null;
  }

  const workspace = await Workspace.findOne({
    _id: board.workspace,
    $or: [
      { owner: userId },
      { members: { $elemMatch: { user: userId, role: { $in: ["owner", "admin", "member"] } } } }
    ]
  });

  if (!workspace) {
    return null;
  }

  return board;
}

export function serializeBoard(board) {
  return {
    id: board._id,
    workspace: board.workspace,
    name: board.name,
    description: board.description,
    visibility: board.visibility,
    createdBy: board.createdBy,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt
  };
}
