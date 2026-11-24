import { Router } from "express";
import { verifyAdminFirebaseToken } from "../middleware/auth.js";
import {
  deleteAdminPost,
  getAdminDashboard,
  getAdminPosts,
  getAdminUsers,
  removeAdminUser,
} from "../controllers/adminController.js";

const router = Router();

router.use(verifyAdminFirebaseToken);
router.get("/dashboard", getAdminDashboard);
router.get("/posts", getAdminPosts);
router.delete("/posts/:id", deleteAdminPost);
router.get("/users", getAdminUsers);
router.delete("/users/:id", removeAdminUser);

export default router;
