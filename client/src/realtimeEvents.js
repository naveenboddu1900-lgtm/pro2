export const boardEvents = {
  cardCreated: "card:created",
  cardMoved: "card:moved",
  cardUpdated: "card:updated",
  cardArchived: "card:archived",
  commentCreated: "comment:created",
  commentUpdated: "comment:updated",
  commentDeleted: "comment:deleted",
  commentTypingStarted: "comment:typing-started",
  commentTypingStopped: "comment:typing-stopped",
  userJoined: "presence:user-joined",
  userLeft: "presence:user-left"
};

export function createBoardEventHandlers({
  onCardCreated,
  onCardMoved,
  onCardUpdated,
  onCardArchived,
  onCommentCreated,
  onCommentUpdated,
  onCommentDeleted,
  onCommentTypingStarted,
  onCommentTypingStopped
}) {
  return {
    [boardEvents.cardCreated]: onCardCreated,
    [boardEvents.cardMoved]: onCardMoved,
    [boardEvents.cardUpdated]: onCardUpdated,
    [boardEvents.cardArchived]: onCardArchived,
    [boardEvents.commentCreated]: onCommentCreated,
    [boardEvents.commentUpdated]: onCommentUpdated,
    [boardEvents.commentDeleted]: onCommentDeleted,
    [boardEvents.commentTypingStarted]: onCommentTypingStarted,
    [boardEvents.commentTypingStopped]: onCommentTypingStopped
  };
}
