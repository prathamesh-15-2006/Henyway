import express from "express";
import {
  submitIssue,
  getIssues,
  resolveIssue,
  getOrderIssue
} from "../controllers/orderIssueController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

// User submits issue for an order
router.post("/", authMiddleware, submitIssue);

// User gets issue status for their order
router.get("/order/:orderId", authMiddleware, getOrderIssue);

// Admin gets all OPEN issues
router.get("/", authMiddleware, adminMiddleware, getIssues);

// Admin resolves an issue
router.patch("/:id/resolve", authMiddleware, adminMiddleware, resolveIssue);

export default router;
