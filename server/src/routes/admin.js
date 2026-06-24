import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getCacheStats } from "../cache.js";
import { getPerformanceSnapshot } from "../middleware/performance.js";

export const adminRouter = Router();

adminRouter.use(requireAuth);

adminRouter.get("/performance", (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin role is required" });
  }

  return res.json({
    cache: getCacheStats(),
    performance: getPerformanceSnapshot()
  });
});
