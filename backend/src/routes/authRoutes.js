import express from "express";
import { register, login } from "../controllers/authController.js";
import { getAllUsers } from "../controllers/authController.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/users", authMiddleware, requireAdmin, getAllUsers);

export default router;
