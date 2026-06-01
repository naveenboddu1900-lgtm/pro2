import express from "express";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      scope: "week-1-day-1-2",
      models: ["User", "Workspace", "Board", "List", "Card"]
    });
  });

  return app;
}
