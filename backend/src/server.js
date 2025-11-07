import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/authRoutes.js";
import courtRoutes from "./routes/courtRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Health
app.get("/", (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || "dev" }));

// Routes
app.use("/auth", authRoutes);
app.use("/courts", courtRoutes);
app.use("/reservations", reservationRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
