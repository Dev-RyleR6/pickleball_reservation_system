import express from "express";
import { getCourts, addCourt } from "../controllers/courtController.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getCourts);
// admin only create
router.post("/", authMiddleware, requireAdmin, addCourt);

export default router;
