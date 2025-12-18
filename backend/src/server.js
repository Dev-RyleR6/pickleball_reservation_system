import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

import authRoutes from "./routes/authRoutes.js";
import courtRoutes from "./routes/courtRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { initializeSocket } from "./socket/socketServer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;

// Initialize Socket.io
initializeSocket(server);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});
// Routes
app.use("/auth", authRoutes);
app.use("/api/courts", courtRoutes);
app.use("/api/reservations", reservationRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" }); //this line might be removed because of the errorHandler import above
});

app.use(errorHandler);

server.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
