import express from "express";
import { getCourts, getCourtById, addCourt, updateCourtStatus, updateCourt, deleteCourt } from "../controllers/courtController.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", getCourts);
router.get("/:id", getCourtById); //get court by id
router.put("/:id/status", authMiddleware, requireAdmin, updateCourtStatus);
router.put("/:id", authMiddleware, requireAdmin, upload.single("image"), updateCourt);
router.delete("/:id", authMiddleware, requireAdmin, deleteCourt);
// admin only create - with image upload
router.post("/", authMiddleware, requireAdmin, upload.single("image"), addCourt);

export default router;
