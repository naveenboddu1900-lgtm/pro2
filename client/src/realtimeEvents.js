export const boardEvents = {
  cardCreated: "card:created",
  cardMoved: "card:moved",
  cardUpdated: "card:updated",
  cardArchived: "card:archived",
  userJoined: "presence:user-joined",
  userLeft: "presence:user-left"
};

export function createBoardEventHandlers({ onCardCreated, onCardMoved, onCardUpdated, onCardArchived }) {
  return {
    [boardEvents.cardCreated]: onCardCreated,
    [boardEvents.cardMoved]: onCardMoved,
    [boardEvents.cardUpdated]: onCardUpdated,
    [boardEvents.cardArchived]: onCardArchived
  };
}
