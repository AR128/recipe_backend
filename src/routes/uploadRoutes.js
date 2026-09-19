import { Router } from "express";
import { uploadImage } from "../controllers/uploadController.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

// Protected route for image upload
router.post("/", verifyToken, uploadImage);

export default router;
