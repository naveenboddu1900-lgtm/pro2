import express from "express";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { boardsRouter } from "./routes/boards.js";
import { cardsRouter } from "./routes/cards.js";
import { listsRouter } from "./routes/lists.js";
import { notificationsRouter } from "./routes/notifications.js";
import { searchRouter } from "./routes/search.js";
import { workspacesRouter } from "./routes/workspaces.js";
import { requestTimer } from "./middleware/performance.js";
import { rateLimiter, securityHeaders } from "./middleware/security.js";
import { getDeploymentReadiness } from "./deployment.js";

export function createApp() {
  const app = express();

  app.use(securityHeaders);
  app.use(rateLimiter);
  app.use(requestTimer);
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      scope: "week-4-day-6-7",
      models: ["User", "Workspace", "Board", "List", "Card", "Notification"]
    });
  });

  app.get("/ready", (_req, res) => {
    res.json(getDeploymentReadiness());
  });

  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/workspaces", workspacesRouter);
  app.use("/api/search", searchRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/boards", boardsRouter);
  app.use("/api/boards/:boardId/lists", listsRouter);
  app.use("/api/boards/:boardId/cards", cardsRouter);

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  });

  return app;
}
