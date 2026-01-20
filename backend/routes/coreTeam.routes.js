import express from "express";
import {
  getAllMembers,
  getAllMembersAdmin,
  createMember,
  updateMember,
  deleteMember,
} from "../controllers/coreTeamController.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllMembers);

// Admin routes
router.get(
  "/admin/all",
  protect,
  authorize("admin", "super_admin"),
  getAllMembersAdmin,
);
router.post("/", protect, authorize("admin", "super_admin"), createMember);
router.put("/:id", protect, authorize("admin", "super_admin"), updateMember);
router.delete("/:id", protect, authorize("admin", "super_admin"), deleteMember);

export default router;
