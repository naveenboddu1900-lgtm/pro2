export function getBoardRoomName(boardId) {
  return `board:${boardId.toString()}`;
}

export function emitBoardEvent(req, boardId, eventName, payload) {
  const io = req.app.locals.io;

  if (!io) {
    return false;
  }

  io.to(getBoardRoomName(boardId)).emit(eventName, {
    ...payload,
    boardId,
    actorId: req.user._id,
    emittedAt: new Date().toISOString()
  });

  return true;
}
