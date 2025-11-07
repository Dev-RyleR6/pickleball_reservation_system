import jwt from "jsonwebtoken";
import { getUserById } from "../models/userModel.js";
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    // fetch fresh user info (optional)
    const user = await getUserById(payload.id);
    if (!user) return res.status(401).json({ error: "Invalid token - user not found" });
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ error: "Forbidden - admin only" });
}
