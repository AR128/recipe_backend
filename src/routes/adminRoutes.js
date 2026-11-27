import { Router } from "express";
import { verifyAdminFirebaseToken } from "../middleware/auth.js";
import {
  deleteAdminPost,
  getAdminDashboard,
  getAdminAccessRequests,
  getAdminPosts,
  getAdminUsers,
  removeAdminUser,
  reviewAdminAccessRequest,
} from "../controllers/adminController.js";

const router = Router();

router.use(verifyAdminFirebaseToken);
router.get("/dashboard", getAdminDashboard);
router.get("/posts", getAdminPosts);
router.delete("/posts/:id", deleteAdminPost);
router.get("/access-requests", getAdminAccessRequests);
router.patch("/access-requests/:id", reviewAdminAccessRequest);
router.get("/users", getAdminUsers);
router.delete("/users/:id", removeAdminUser);

export default router;
