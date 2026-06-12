export function reorderList(list, startIndex, endIndex) {
  const nextCardIds = Array.from(list.cardIds);
  const [movedCard] = nextCardIds.splice(startIndex, 1);
  nextCardIds.splice(endIndex, 0, movedCard);

  return {
    ...list,
    cardIds: nextCardIds
  };
}

export function moveCard(sourceList, destinationList, source, destination) {
  const sourceCardIds = Array.from(sourceList.cardIds);
  const destinationCardIds = Array.from(destinationList.cardIds);
  const [movedCard] = sourceCardIds.splice(source.index, 1);

  destinationCardIds.splice(destination.index, 0, movedCard);

  return {
    [sourceList.id]: {
      ...sourceList,
      cardIds: sourceCardIds
    },
    [destinationList.id]: {
      ...destinationList,
      cardIds: destinationCardIds
    }
  };
}

export function applyCardMove(state, source, destination) {
  const sourceList = state.lists[source.droppableId];
  const destinationList = state.lists[destination.droppableId];

  if (!sourceList || !destinationList) {
    return state;
  }

  if (sourceList === destinationList) {
    return {
      ...state,
      lists: {
        ...state.lists,
        [sourceList.id]: reorderList(sourceList, source.index, destination.index)
      }
    };
  }

  return {
    ...state,
    lists: {
      ...state.lists,
      ...moveCard(sourceList, destinationList, source, destination)
    }
  };
}

export function createMoveOperation(result) {
  const { draggableId, source, destination } = result;

  return {
    id: `${draggableId}-${Date.now()}`,
    cardId: draggableId,
    source,
    destination,
    status: "pending"
  };
}

export function getBoardMetrics(kanban) {
  return kanban.listOrder.reduce(
    (metrics, listId) => {
      const list = kanban.lists[listId];
      const cards = list.cardIds.map((cardId) => kanban.cards[cardId]);

      metrics.totalCards += cards.length;
      metrics.totalPoints += cards.reduce((sum, card) => sum + card.points, 0);

      return metrics;
    },
    { totalCards: 0, totalPoints: 0 }
  );
}

export function kanbanReducer(state, action) {
  switch (action.type) {
    case "optimistic-move": {
      const operation = action.operation;

      return {
        ...applyCardMove(state, operation.source, operation.destination),
        pendingOperations: [...state.pendingOperations, operation],
        lastSyncedAt: state.lastSyncedAt,
        lastMove: operation
      };
    }
    case "confirm-move": {
      return {
        ...state,
        pendingOperations: state.pendingOperations.filter((operation) => operation.id !== action.operationId),
        lastSyncedAt: new Date().toISOString()
      };
    }
    case "reject-move": {
      return {
        ...action.snapshot,
        pendingOperations: state.pendingOperations.filter((operation) => operation.id !== action.operationId),
        lastSyncedAt: state.lastSyncedAt
      };
    }
    default:
      return state;
  }
}
