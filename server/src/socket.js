import { Server } from "socket.io";
import { config } from "./config.js";
import { Board, User } from "./models/index.js";
import { verifyToken } from "./utils/token.js";
import { findAccessibleBoard } from "./utils/boardAccess.js";
import { getBoardRoomName } from "./utils/realtime.js";

const activeConnections = new Map();

function readHandshakeToken(socket) {
  const authToken = socket.handshake.auth?.token;
  const header = socket.handshake.headers?.authorization || "";
  const [scheme, bearerToken] = header.split(" ");

  if (authToken) {
    return authToken;
  }

  if (scheme === "Bearer" && bearerToken) {
    return bearerToken;
  }

  return null;
}

function serializeConnection(socket) {
  return {
    socketId: socket.id,
    userId: socket.user._id.toString(),
    connectedAt: socket.connectedAt
  };
}

function acknowledgeSafely(acknowledge, payload) {
  if (typeof acknowledge === "function") {
    acknowledge(payload);
  }
}

async function authenticateSocket(socket, next) {
  try {
    const token = readHandshakeToken(socket);

    if (!token) {
      return next(new Error("Authentication token is required"));
    }

    const payload = verifyToken(token, config.jwtSecret);
    const user = await User.findById(payload.sub);

    if (!user) {
      return next(new Error("User no longer exists"));
    }

    socket.user = user;
    socket.connectedAt = new Date().toISOString();
    return next();
  } catch (_error) {
    return next(new Error("Invalid or expired token"));
  }
}

async function joinBoardRoom(socket, boardId, acknowledge) {
  try {
    const board = await findAccessibleBoard(boardId, socket.user._id);

    if (!board) {
      return acknowledgeSafely(acknowledge, { ok: false, message: "Board not found or access denied" });
    }

    const roomName = getBoardRoomName(board._id);
    await socket.join(roomName);

    socket.to(roomName).emit("presence:user-joined", {
      boardId: board._id,
      userId: socket.user._id,
      socketId: socket.id
    });

    return acknowledgeSafely(acknowledge, { ok: true, room: roomName });
  } catch (_error) {
    return acknowledgeSafely(acknowledge, { ok: false, message: "Unable to join board room" });
  }
}

async function leaveBoardRoom(socket, boardId, acknowledge) {
  try {
    const board = await Board.findById(boardId).select("_id");

    if (!board) {
      return acknowledgeSafely(acknowledge, { ok: false, message: "Board not found" });
    }

    const roomName = getBoardRoomName(board._id);
    await socket.leave(roomName);

    socket.to(roomName).emit("presence:user-left", {
      boardId: board._id,
      userId: socket.user._id,
      socketId: socket.id
    });

    return acknowledgeSafely(acknowledge, { ok: true, room: roomName });
  } catch (_error) {
    return acknowledgeSafely(acknowledge, { ok: false, message: "Unable to leave board room" });
  }
}

async function emitTypingEvent(socket, eventName, payload, acknowledge) {
  try {
    const { boardId, cardId } = payload || {};

    if (!boardId || !cardId) {
      return acknowledgeSafely(acknowledge, { ok: false, message: "Board id and card id are required" });
    }

    const board = await findAccessibleBoard(boardId, socket.user._id);

    if (!board) {
      return acknowledgeSafely(acknowledge, { ok: false, message: "Board not found or access denied" });
    }

    const roomName = getBoardRoomName(board._id);

    socket.to(roomName).emit(eventName, {
      boardId: board._id,
      cardId,
      userId: socket.user._id,
      socketId: socket.id,
      emittedAt: new Date().toISOString()
    });

    return acknowledgeSafely(acknowledge, { ok: true });
  } catch (_error) {
    return acknowledgeSafely(acknowledge, { ok: false, message: "Unable to emit typing status" });
  }
}

function handleDisconnect(socket, reason) {
  const connection = activeConnections.get(socket.id);

  if (!connection) {
    return;
  }

  activeConnections.delete(socket.id);

  socket.broadcast.emit("presence:user-disconnected", {
    socketId: socket.id,
    userId: connection.userId,
    reason
  });
}

export function registerSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*"
    }
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    activeConnections.set(socket.id, serializeConnection(socket));

    socket.emit("connection:ready", {
      socketId: socket.id,
      userId: socket.user._id,
      connectedAt: socket.connectedAt
    });

    socket.on("board:join", (boardId, acknowledge) => {
      joinBoardRoom(socket, boardId, acknowledge);
    });

    socket.on("board:leave", (boardId, acknowledge) => {
      leaveBoardRoom(socket, boardId, acknowledge);
    });

    socket.on("comment:typing-started", (payload, acknowledge) => {
      emitTypingEvent(socket, "comment:typing-started", payload, acknowledge);
    });

    socket.on("comment:typing-stopped", (payload, acknowledge) => {
      emitTypingEvent(socket, "comment:typing-stopped", payload, acknowledge);
    });

    socket.on("disconnect", (reason) => {
      handleDisconnect(socket, reason);
    });
  });

  return io;
}

export function getActiveConnectionCount() {
  return activeConnections.size;
}
