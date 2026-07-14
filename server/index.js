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

  // Render (and similar hosts) terminate TLS at a reverse proxy.
  app.set("trust proxy", 1);

  const allowedOrigins = new Set(
    [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "https://ukulele-nine.vercel.app",
    ].filter(Boolean)
  );

  app.use(cors({
    origin(origin, callback) {
      // Non-browser clients (curl, server-to-server) often omit Origin.
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      // Vercel preview deployments: https://<project>-<hash>-<team>.vercel.app
      if (/^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Cache-Control",
        "Pragma",
        "Expires"
    ],
    exposedHeaders: ["Set-Cookie"]
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
