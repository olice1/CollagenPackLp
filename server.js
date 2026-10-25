import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

import { handleCreateOrder } from "./api/orders.js";
import { handleTelegramWebhook } from "./api/telegram.js";
import { handleMetaEvent } from "./api/meta.js";
import { PRICING_CONFIG, POPULAR_MOROCCAN_CITIES } from "./src/config/pricing.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public
app.use(express.static(path.join(__dirname, "public")));
// Serve src files (CSS, JS modules)
app.use("/src", express.static(path.join(__dirname, "src")));

// Public safe configuration endpoint
app.get("/api/config", (req, res) => {
  res.json({
    pricing: PRICING_CONFIG,
    cities: POPULAR_MOROCCAN_CITIES,
    metaPixelId: process.env.META_PIXEL_ID || null
  });
});

// API Routes
app.post("/api/orders", handleCreateOrder);
app.post("/api/telegram", handleTelegramWebhook);
app.post("/api/meta", handleMetaEvent);

// Serve main landing page
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🌿 AUREVA Landing Page Server running on port ${PORT}`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
