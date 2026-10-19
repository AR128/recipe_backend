import express from "express";
import "dotenv/config";
import helmet from "helmet";
import cors from "cors";
import { randomUUID } from "node:crypto";
import connectDB from "./config/db.js";
import adminRouter from "./routes/adminRoutes.js";
import userRouter from "./routes/userRoutes.js";
import recipeRouter from "./routes/recipeRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";
import { coarseApiLimiter } from "./middleware/tokenBucket.js";
import { sanitizeRequest } from "./middleware/sanitizeRequest.js";

const app = express();
const port = process.env.PORT || 3000;

if (process.env.TRUST_PROXY) {
  const trustedHops = Number(process.env.TRUST_PROXY);
  if (!Number.isSafeInteger(trustedHops) || trustedHops < 1) {
    throw new Error("TRUST_PROXY must be a positive integer when configured.");
  }
  app.set("trust proxy", trustedHops);
}

await connectDB();

// Pull allowed CORS origins from .env
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];

if (
  process.env.NODE_ENV === "production" &&
  (allowedOrigins.length === 0 || allowedOrigins.includes("*"))
) {
  throw new Error(
    "Production requires an explicit CORS_ORIGIN allowlist; wildcard origins are not permitted."
  );
}

app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.set("X-Request-Id", req.requestId);
  next();
});
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes("*") ||
        (allowedOrigins.length === 0 &&
          /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))
      ) {
        callback(null, true);
      } else {
        const error = new Error("Not allowed by CORS");
        error.status = 403;
        callback(error);
      }
    },
  })
);
// Health check
app.get("/health", (req, res) => {
  res.send({ status: "healthy", timestamp: new Date().toISOString() });
});

app.use("/api", coarseApiLimiter);

// Upload requests authenticate before parsing their comparatively large body.
app.use("/api/upload", uploadRouter);

app.use(express.json({ limit: "128kb", strict: true }));
app.use(sanitizeRequest);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);
app.use("/api/recipes", recipeRouter);

app.get("/", (req, res) => {
  res.send("Recipe Management API.");
});

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested endpoint does not exist.",
    requestId: req.requestId,
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  const status =
    error.status === 413 || error.type === "entity.too.large"
      ? 413
      : error.status === 400 || error.type === "entity.parse.failed"
        ? 400
        : error.status === 403
          ? 403
          : 500;

  console.error("Request failed:", {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    status,
    errorName: error.name,
    errorCode: error.code,
    errorMessage: error.message,
  });

  res.status(status).json({
    error:
      status === 400
        ? "Bad Request"
        : status === 413
          ? "Payload Too Large"
          : status === 403
            ? "Forbidden"
            : "Internal Server Error",
    message:
      status === 400
        ? "The request body is invalid."
        : status === 413
          ? "The request body exceeds the permitted size."
          : status === 403
            ? "The request origin is not allowed."
            : "An unexpected error occurred.",
    requestId: req.requestId,
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${port}`);
});
