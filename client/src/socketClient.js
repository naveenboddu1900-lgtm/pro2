import { io } from "socket.io-client";
import { boardEvents } from "./realtimeEvents.js";

export const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

export function createWorkspaceSocket(token) {
  return io(socketUrl, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: false
  });
}

export function bindBoardSocketEvents(socket, onEvent) {
  const events = [
    "connection:ready",
    boardEvents.cardCreated,
    boardEvents.cardMoved,
    boardEvents.cardUpdated,
    boardEvents.cardArchived,
    boardEvents.commentCreated,
    boardEvents.commentUpdated,
    boardEvents.commentDeleted,
    boardEvents.commentTypingStarted,
    boardEvents.commentTypingStopped,
    boardEvents.userJoined,
    boardEvents.userLeft,
    "presence:user-disconnected",
    "connect_error",
    "disconnect"
  ];

  for (const eventName of events) {
    socket.on(eventName, (payload) => {
      onEvent({
        name: eventName,
        payload,
        receivedAt: new Date().toISOString()
      });
    });
  }

  return () => {
    for (const eventName of events) {
      socket.off(eventName);
    }
  };
}
