import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { stripeWebhookAction } from "./controllers/stripe.controller.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { multerErrorMiddleware } from "./middleware/multerError.middleware.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";
import routes from "./routes/index.js";
import { asyncHandler } from "./utils/asyncHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientUrls.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Originea cererii nu este permisa de CORS."));
    },
    credentials: true
  })
);
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), asyncHandler(stripeWebhookAction));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", routes);
app.use(notFoundMiddleware);
app.use(multerErrorMiddleware);
app.use(errorMiddleware);
