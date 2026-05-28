import mongoose from "mongoose";
import OrderIssue from "../models/OrderIssue.js";
import Order from "../models/Order.js";
import { sendEmail } from "../utils/sendEmail.js";

// Helper function to check if issue can be submitted for an order
const canSubmitIssue = (order) => {
  const now = new Date();
  const orderDate = new Date(order.createdAt);
  const deliveryDate = order.deliveryStatus === "DELIVERED" ? new Date(order.updatedAt) : null;

  // Issue allowed only if:
  // 1. Order is today, OR
  // 2. Delivered within 24 hours

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const orderDay = new Date(orderDate);
  orderDay.setHours(0, 0, 0, 0);

  const isToday = today.getTime() === orderDay.getTime();

  let deliveredWithin24Hours = false;
  if (deliveryDate) {
    const hoursSinceDelivery = (now - deliveryDate) / (1000 * 60 * 60);
    deliveredWithin24Hours = hoursSinceDelivery <= 24;
  }

  return isToday || deliveredWithin24Hours;
};

// Submit issue for an order
export const submitIssue = async (req, res) => {
  try {
    const { orderId, issueType, message } = req.body;
    const userId = req.user.id;

    // Find the order
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if order belongs to user
    if (order.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order"
      });
    }

    // Check time-based rules
    if (!canSubmitIssue(order)) {
      return res.status(400).json({
        success: false,
        message: "Issues can only be submitted for today's orders or orders delivered within 24 hours"
      });
    }

    // Check if issue already exists for this order
    const existingIssue = await OrderIssue.findOne({ orderId });
    if (existingIssue) {
      return res.status(400).json({
        success: false,
        message: "An issue already exists for this order"
      });
    }

    // Create the issue
    const issue = new OrderIssue({
      orderId,
      userId,
      issueType,
      message,
      status: "OPEN"
    });

    await issue.save();

    // Send notification email (you can replace with WhatsApp later)
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || "admin@henyway.com",
        subject: `New Order Issue: ${issueType}`,
        html: `
          <h2>New Order Issue Submitted</h2>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Issue Type:</strong> ${issueType}</p>
          <p><strong>Message:</strong> ${message || "No additional message"}</p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p>Please resolve this issue promptly.</p>
        `
      });
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: "Issue submitted successfully. We will contact you shortly.",
      data: issue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error submitting issue",
      error: error.message
    });
  }
};

// Get all OPEN issues for admin (sorted by newest first)
export const getIssues = async (req, res) => {
  try {
    const issues = await OrderIssue.find({ status: "OPEN" })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: issues
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching issues",
      error: error.message
    });
  }
};

// Resolve an issue
export const resolveIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryStatus } = req.body; // Optional: update order delivery status

    // Validate the id parameter
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID"
      });
    }

    const issue = await OrderIssue.findById(id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }

    // Update issue
    issue.status = "RESOLVED";
    issue.resolvedAt = new Date();
    await issue.save();

    // Optionally update order delivery status
    if (deliveryStatus) {
      const order = await Order.findOne({ orderId: issue.orderId });
      if (order) {
        if (["DELAYED", "DELIVERED"].includes(deliveryStatus)) {
          order.deliveryStatus = deliveryStatus;
          await order.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Issue resolved successfully",
      data: issue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error resolving issue",
      error: error.message
    });
  }
};

// Get issue for a specific order (for user to check status)
export const getOrderIssue = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const issue = await OrderIssue.findOne({ orderId });
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "No issue found for this order"
      });
    }

    // Check if issue belongs to user
    if (issue.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to issue"
      });
    }

    res.status(200).json({
      success: true,
      data: issue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching issue",
      error: error.message
    });
  }
};
