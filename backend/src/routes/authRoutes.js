import express from "express";
import { register, login, getAllUsers, updateUserRole, deleteUser, updateProfile, changePassword } from "../controllers/authController.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/users", authMiddleware, requireAdmin, getAllUsers);
router.put("/users/:id/role", authMiddleware, requireAdmin, updateUserRole);
router.delete("/users/:id", authMiddleware, requireAdmin, deleteUser);
router.put("/users/:id/profile", authMiddleware, updateProfile);
router.put("/users/:id/password", authMiddleware, changePassword);

export default router;
