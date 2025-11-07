import express from "express";
import { getCourts, getCourtById, addCourt, updateCourtStatus } from "../controllers/courtController.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getCourts);
router.get("/:id", getCourtById); //get court by id
router.put("/:id/status", authMiddleware, requireAdmin, updateCourtStatus);
// admin only create
router.post("/", authMiddleware, requireAdmin, addCourt);

export default router;
