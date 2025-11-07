import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import courtRoutes from "./routes/courtRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/courts", courtRoutes);
app.use("/reservations", reservationRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
