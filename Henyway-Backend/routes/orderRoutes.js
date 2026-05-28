import express from "express";
import {
  createOrder,
  updateOrderAddress,
  updateOrderDelivery,
  createRazorpayOrder,
  verifyPayment,
  getOrder,
  getOrders,
  getAllOrdersForAdmin,
  startDelivery,
  delayDelivery,
  completeDelivery,
  updateOrderStatus,
  getOrderStatus,
  getAdminOrderStatus,
  razorpayWebhook
} from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Create temporary order from cart
router.post("/create", authMiddleware, createOrder);

// Create order for guest users
router.post("/create-guest", createOrder);

// Update order with address
router.put("/:orderId/address", updateOrderAddress);

// Update order delivery preferences
router.put("/:orderId/delivery", updateOrderDelivery);

// Create Razorpay order
router.post("/:orderId/razorpay", createRazorpayOrder);

// Verify payment
router.post("/verify-payment", verifyPayment);

// Get order details
router.get("/:orderId", getOrder);

// Get user-friendly order status
router.get("/:orderId/status", getOrderStatus);

// Get user's orders
router.get("/", authMiddleware, getOrders);

// Get all orders for admin dashboard (admin only)
router.get("/admin/all", authMiddleware, adminMiddleware, getAllOrdersForAdmin);

// Get admin order status (admin only)
router.get("/:orderId/admin-status", authMiddleware, adminMiddleware, getAdminOrderStatus);

// Update order status (admin only)
router.put("/:orderId/status", authMiddleware, adminMiddleware, updateOrderStatus);

// Start delivery (admin/rider only)
router.put("/:orderId/start-delivery", authMiddleware, adminMiddleware, startDelivery);

// Mark delivery as delayed (admin/rider only)
router.put("/:orderId/delay-delivery", authMiddleware, adminMiddleware, delayDelivery);

// Complete delivery (admin/rider only)
router.put("/:orderId/complete-delivery", authMiddleware, adminMiddleware, completeDelivery);

// Razorpay webhook
router.post("/webhook/razorpay", express.raw({ type: 'application/json' }), razorpayWebhook);

export default router;
