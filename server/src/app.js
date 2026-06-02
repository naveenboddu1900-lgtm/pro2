import express from "express";
import { authRouter } from "./routes/auth.js";
import { workspacesRouter } from "./routes/workspaces.js";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      scope: "week-1-day-2-3",
      models: ["User", "Workspace", "Board", "List", "Card"]
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/workspaces", workspacesRouter);

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  });

  return app;
}
