import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as userModel from "../models/userModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const SALT_ROUNDS = 10;

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });

    const existing = await userModel.getUserByEmail(email);
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userModel.createUser({ name, email, passwordHash: hash, role:"player" });

    res.status(201).json({ message: "User created", user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const user = await userModel.getUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });

    res.json({ message: "Logged in", token, user: payload });
  } catch (err) { next(err); }
}

export async function getAllUsers(req, res, next) {
  try {
    const users = await userModel.getAllUsers();
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!["admin", "player"].includes(role)) return res.status(400).json({ error: "Invalid role" });
    
    const user = await userModel.getUserById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const updated = await userModel.updateUserRole(id, role);
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) return res.status(400).json({ error: "Invalid user ID" });
    
    // Prevent deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }
    
    const user = await userModel.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    await userModel.deleteUser(userId);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    const { name, email } = req.body;
    
    if (isNaN(userId)) return res.status(400).json({ error: "Invalid user ID" });
    
    // Users can only update their own profile, unless they're admin
    // Compare as numbers to handle both string and number IDs
    const currentUserId = typeof req.user.id === 'string' ? parseInt(req.user.id) : req.user.id;
    if (userId !== currentUserId && req.user.role !== "admin") {
      return res.status(403).json({ error: "You can only update your own profile" });
    }
    
    if (!name || !email) return res.status(400).json({ error: "Name and email are required" });
    
    const updated = await userModel.updateUserProfile(userId, { name, email });
    res.json({ user: updated });
  } catch (err) {
    if (err.message && err.message.includes("Email already in use")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    const { currentPassword, newPassword } = req.body;
    
    if (isNaN(userId)) return res.status(400).json({ error: "Invalid user ID" });
    
    // Users can only change their own password
    // Compare as numbers to handle both string and number IDs
    const currentUserId = typeof req.user.id === 'string' ? parseInt(req.user.id) : req.user.id;
    if (userId !== currentUserId) {
      return res.status(403).json({ error: "You can only change your own password" });
    }
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }
    
    const user = await userModel.getUserByEmail(req.user.email);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(401).json({ error: "Current password is incorrect" });
    
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userModel.updateUserPassword(userId, hash);
    
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
}