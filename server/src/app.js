import express from "express";
import { authRouter } from "./routes/auth.js";
import { boardsRouter } from "./routes/boards.js";
import { cardsRouter } from "./routes/cards.js";
import { listsRouter } from "./routes/lists.js";
import { workspacesRouter } from "./routes/workspaces.js";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      scope: "week-3-day-3-5",
      models: ["User", "Workspace", "Board", "List", "Card"]
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/workspaces", workspacesRouter);
  app.use("/api/boards", boardsRouter);
  app.use("/api/boards/:boardId/lists", listsRouter);
  app.use("/api/boards/:boardId/cards", cardsRouter);

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  });

  return app;
}
