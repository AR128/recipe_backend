import { Router } from "express";
import express from "express";
import { uploadImage } from "../controllers/uploadController.js";
import { verifyFirebaseTokenRevoked } from "../middleware/auth.js";
import { sanitizeRequest } from "../middleware/sanitizeRequest.js";
import {
  uploadIpLimiter,
  uploadUserLimiter,
} from "../middleware/tokenBucket.js";

const router = Router();

router.post(
  "/",
  verifyFirebaseTokenRevoked,
  uploadIpLimiter,
  uploadUserLimiter,
  express.json({ limit: "7mb", strict: true }),
  sanitizeRequest,
  uploadImage
);

export default router;
