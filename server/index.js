import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { config } from "./config.js";
import connectDB from "./db.js";
import { attachUser } from "./middleware.js";

import authRoutes from "./routes/auth.js";
import favoriteRoutes from "./routes/favorites.js";
import songRoutes from "./routes/songs.js";
import userRoutes from "./routes/users.js";

dotenv.config();

async function start() {
  await connectDB();

  const app = express();

  app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true, // Important for cookies/auth
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"]
  }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(attachUser);

  // ====================== ROUTES ======================

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/songs", songRoutes);
  app.use("/api/users", userRoutes);

  // ====================== START ======================

  app.listen(config.port, () => {
      console.log(`✅ API running on http://localhost:${config.port}`);
  });
}

start();
