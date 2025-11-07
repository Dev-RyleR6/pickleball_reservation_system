import express from "express";
import {
  createReservationHandler,
  getMyReservationsHandler,
  getAllReservationsHandler,
  approveReservationHandler,
  cancelMyReservationHandler,
} from "../controllers/reservationController.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Player endpoints
router.post("/", authMiddleware, createReservationHandler);
router.get("/me", authMiddleware, getMyReservationsHandler);
router.delete("/:id/cancel", authMiddleware, cancelMyReservationHandler);

// Admin endpoints
router.get("/", authMiddleware, requireAdmin, getAllReservationsHandler);
router.post("/:id/action", authMiddleware, requireAdmin, approveReservationHandler);

export default router;
