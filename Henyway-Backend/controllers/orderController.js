import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import {
  verifyDeliveryEligibility,
  verifyDeliveryEligibilityEnhanced,
  logUnsupportedArea,
  validateOrderTime,
  calculateEstimatedDeliveryTime,
  validateScheduledDeliveryTime
} from "../utils/deliveryUtils.js";

// Initialize Razorpay only when needed
let razorpay = null;

const getRazorpayInstance = () => {
  if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

// Create temporary order from cart
export const createOrder = async (req, res) => {
  try {
    // Validate order time (9 AM - 9 PM)
    const timeValidation = validateOrderTime();
    if (!timeValidation.canPlace) {
      return res.status(400).json({
        success: false,
        message: timeValidation.reason,
        error: "ORDER_TIME_INVALID",
        nextAvailableTime: timeValidation.nextAvailableTime
      });
    }

    const userId = req.user ? req.user.id : null;
    const { guestId } = req.body;

    if (!userId && !guestId) {
      return res.status(400).json({
        success: false,
        message: "User ID or Guest ID is required"
      });
    }

    // Get cart items
    let cart;
    if (userId) {
      cart = await Cart.findOne({ userId }).populate('items.productId');
    } else {
      // For guest users, cart might be stored in session or local storage
      // For now, assume guest cart is passed in request
      const { cartItems } = req.body;
      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cart is empty"
        });
      }
      cart = { items: cartItems };
    }

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty"
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.productId;
      if (!product) continue;

      const price = product.price || 0;
      const itemTotal = price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: price,
        name: product.name
      });
    }

    // Generate unique order ID
    const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();

    // Determine scheduled delivery date and slot based on current time
    const now = new Date();
    const currentHour = now.getHours();
    let scheduledDeliveryDate;
    let scheduledDeliverySlot;
    let isSameDayDelivery = true;

    // Case A: Time 9 AM – 9 PM - Allow same-day delivery
    if (currentHour >= 9 && currentHour < 21) {
      scheduledDeliveryDate = new Date(now);
      scheduledDeliveryDate.setHours(0, 0, 0, 0); // Today
      scheduledDeliverySlot = "ASAP"; // Default slot
    }
    // Case B: Time After 9 PM - Force tomorrow delivery
    else if (currentHour >= 21) {
      scheduledDeliveryDate = new Date(now);
      scheduledDeliveryDate.setDate(scheduledDeliveryDate.getDate() + 1);
      scheduledDeliveryDate.setHours(0, 0, 0, 0); // Tomorrow
      scheduledDeliverySlot = "9:00 AM - 9:00 PM"; // Default slot for tomorrow
      isSameDayDelivery = false;
    }
    // Case C: Time Before 9 AM - Allow today delivery starting from 9 AM
    else {
      scheduledDeliveryDate = new Date(now);
      scheduledDeliveryDate.setHours(0, 0, 0, 0); // Today
      scheduledDeliverySlot = "9:00 AM - 9:00 PM"; // Default slot
    }

    // Create order - Order Creation Flow
    const order = new Order({
      orderId,
      userId,
      guestId,
      items: orderItems,
      totalAmount,
      orderStatus: "CREATED",
      paymentStatus: "PENDING_PAYMENT",
      deliveryStatus: "NOT_STARTED",
      isSameDayDelivery,
      scheduledDeliveryDate,
      scheduledDeliverySlot
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message
    });
  }
};

// Update order with address
export const updateOrderAddress = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { address } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if order belongs to user or guest
    if (req.user && order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order"
      });
    }

    if (!req.user && order.guestId !== req.body.guestId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order"
      });
    }

    // Verify delivery eligibility
    const eligibilityCheck = await verifyDeliveryEligibilityEnhanced(address);
    if (!eligibilityCheck.eligible) {
      // Log unsupported area for monitoring
      logUnsupportedArea(address.city, address.coordinates);

      return res.status(400).json({
        success: false,
        message: eligibilityCheck.reason,
        error: "DELIVERY_NOT_AVAILABLE",
        verificationDetails: {
          verifiedArea: eligibilityCheck.verifiedArea,
          confidence: eligibilityCheck.confidence
        }
      });
    }

    order.address = address;
    order.paymentStatus = "PENDING_PAYMENT";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order address updated successfully",
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating order address",
      error: error.message
    });
  }
};

// Update order delivery preferences
export const updateOrderDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryType, scheduledDeliveryTime } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if order belongs to user or guest
    if (req.user && order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order"
      });
    }

    if (!req.user && order.guestId !== req.body.guestId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order"
      });
    }

    // Validate delivery type
    if (!["ASAP", "SCHEDULED"].includes(deliveryType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery type. Must be 'ASAP' or 'SCHEDULED'"
      });
    }

    // If scheduled delivery, validate the time
    if (deliveryType === "SCHEDULED") {
      if (!scheduledDeliveryTime) {
        return res.status(400).json({
          success: false,
          message: "Scheduled delivery time is required"
        });
      }

      const validation = validateScheduledDeliveryTime(scheduledDeliveryTime, order.createdAt);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.reason
        });
      }

      order.scheduledDeliveryTime = new Date(scheduledDeliveryTime);
    } else {
      // For ASAP, clear any scheduled time
      order.scheduledDeliveryTime = null;
    }

    order.deliveryType = deliveryType;

    // Calculate estimated delivery time
    order.estimatedDeliveryTime = calculateEstimatedDeliveryTime(
      deliveryType,
      order.scheduledDeliveryTime,
      order.createdAt
    );

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order delivery preferences updated successfully",
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating order delivery preferences",
      error: error.message
    });
  }
};

// Create Razorpay order
export const createRazorpayOrder = async (req, res) => {
  try {
    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      return res.status(500).json({
        success: false,
        message: "Payment service not configured"
      });
    }

    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check authorization
    if (req.user && order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order"
      });
    }

    if (!req.user && order.guestId !== req.body.guestId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order"
      });
    }

    // Re-check delivery eligibility before payment initiation
    if (order.address) {
      const eligibilityCheck = await verifyDeliveryEligibilityEnhanced(order.address);
      if (!eligibilityCheck.eligible) {
        return res.status(400).json({
          success: false,
          message: eligibilityCheck.reason,
          error: "DELIVERY_NOT_AVAILABLE",
          verificationDetails: {
            verifiedArea: eligibilityCheck.verifiedArea,
            confidence: eligibilityCheck.confidence
          }
        });
      }
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(order.totalAmount * 100), // Amount in paise
      currency: "INR",
      receipt: order.orderId,
      payment_capture: 1
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    // Update order with Razorpay order ID
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    // Create payment record
    const payment = new Payment({
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: order.totalAmount,
      status: "CREATED"
    });
    await payment.save();

    // Update order with payment ID
    order.paymentId = payment._id;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Razorpay order created successfully",
      data: {
        orderId: order.orderId,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating Razorpay order",
      error: error.message
    });
  }
};

// Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findOne({ orderId }).populate('paymentId');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check authorization
    if (req.user && order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order"
      });
    }

    if (!req.user && order.guestId !== req.body.guestId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order"
      });
    }

    // Verify signature
    const sign = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpaySignature !== expectedSign) {
      // Update payment status to failed
      if (order.paymentId) {
        order.paymentId.status = "FAILED";
        await order.paymentId.save();
      }
      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

    // Update payment
    order.paymentId.razorpayPaymentId = razorpayPaymentId;
    order.paymentId.razorpaySignature = razorpaySignature;
    order.paymentId.status = "VERIFIED";
    await order.paymentId.save();

    // Update order status - Payment Success Flow
    order.paymentStatus = "PAID";
    order.orderStatus = "PLACED";
    order.deliveryStatus = "NOT_STARTED";

    // Add status history entry: PLACED → time
    order.statusHistory.push({
      status: "PLACED",
      at: new Date(),
      note: "Payment verified successfully",
      by: "SYSTEM"
    });

    // Set estimated delivery time if not already set
    if (!order.estimatedDeliveryTime) {
      order.estimatedDeliveryTime = calculateEstimatedDeliveryTime(
        order.deliveryType,
        order.scheduledDeliveryTime,
        order.createdAt
      );
    }

    await order.save();

    // Clear user's cart if logged in
    if (order.userId) {
      await Cart.findOneAndUpdate(
        { userId: order.userId },
        { items: [], totalPrice: 0 }
      );
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message
    });
  }
};

// Get order details
export const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId })
      .populate('items.productId')
      .populate('paymentId')
      .populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check authorization
    if (req.user && order.userId && order.userId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order"
      });
    }

    if (!req.user && order.guestId !== req.query.guestId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order"
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message
    });
  }
};

// Get user's orders (admin can see all)
export const getOrders = async (req, res) => {
  try {
    let query = {};

    if (req.user.role !== "admin") {
      query.userId = req.user.id;
    }

    const orders = await Order.find(query)
      .populate('items.productId')
      .populate('paymentId')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message
    });
  }
};

// Get all orders for admin dashboard with filters and pagination
export const getAllOrdersForAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      userId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    if (status) {
      query.status = status;
    }

    if (userId) {
      query.userId = userId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get orders with pagination
    const orders = await Order.find(query)
      .populate('items.productId', 'name price')
      .populate('paymentId', 'status amount')
      .populate('userId', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    // Get order statistics
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats,
        filters: {
          status,
          userId,
          startDate,
          endDate
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching orders for admin",
      error: error.message
    });
  }
};

// Start delivery (admin/rider only)
export const startDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if order is in correct state for delivery start
    if (order.orderStatus !== "PLACED") {
      return res.status(400).json({
        success: false,
        message: "Order must be placed before starting delivery"
      });
    }

    // Backend checks: Current time must be within 9 AM – 9 PM
    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour < 9 || currentHour >= 21) {
      return res.status(400).json({
        success: false,
        message: "Pickup can only happen between 9:00 AM and 9:00 PM",
        error: "BUSINESS_HOURS_VIOLATION"
      });
    }

    // Current date must match scheduled delivery date
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const scheduledDate = new Date(order.scheduledDeliveryDate);
    scheduledDate.setHours(0, 0, 0, 0);

    if (today.getTime() !== scheduledDate.getTime()) {
      return res.status(400).json({
        success: false,
        message: "Pickup can only happen on the scheduled delivery date",
        error: "DATE_MISMATCH"
      });
    }

    // Delivery Start Flow (Admin / Rider Assigned)
    order.deliveryStatus = "IN_TRANSIT";
    order.orderStatus = "SHIPPED";

    // Add history: SHIPPED → time
    order.statusHistory.push({
      status: "SHIPPED",
      at: new Date(),
      note: "Order packed and rider assigned",
      by: "ADMIN"
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: "Delivery started successfully",
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error starting delivery",
      error: error.message
    });
  }
};

// Mark delivery as delayed (admin/rider only)
export const delayDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { delayReason } = req.body;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Validate delay reason
    if (!["TRAFFIC", "WEATHER", "OTHER"].includes(delayReason)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delay reason. Must be TRAFFIC, WEATHER, or OTHER"
      });
    }

    // Traffic Delay Flow (Optional)
    order.deliveryStatus = "DELAYED";
    order.delayReason = delayReason;

    // Add note: delayReason = TRAFFIC (or WEATHER/OTHER)
    order.statusHistory.push({
      status: "DELAYED",
      at: new Date(),
      by: "ADMIN",
      note: `Delivery delayed due to ${delayReason.toLowerCase()}`
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: "Delivery marked as delayed",
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking delivery as delayed",
      error: error.message
    });
  }
};

// Complete delivery (admin/rider only)
export const completeDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if order is in transit
    if (order.deliveryStatus !== "IN_TRANSIT") {
      return res.status(400).json({
        success: false,
        message: "Order must be in transit to complete delivery"
      });
    }

    // Delivery Completed Flow
    order.deliveryStatus = "DELIVERED";

    // Only set orderStatus to DELIVERED if payment is PAID
    if (order.paymentStatus === "PAID") {
      order.orderStatus = "DELIVERED";

      // Add history: DELIVERED → time
      order.statusHistory.push({
        status: "DELIVERED",
        at: new Date(),
        note: "Order delivered successfully",
        by: "ADMIN"
      });
    } else {
      // Add history for delivery completion but order not marked as delivered due to pending payment
      order.statusHistory.push({
        status: "DELIVERED",
        at: new Date(),
        note: "Delivery completed but order not marked as delivered due to pending payment",
        by: "ADMIN"
      });
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Delivery completed successfully",
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error completing delivery",
      error: error.message
    });
  }
};

// Update order status (admin only) - handles order status updates
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, deliveryStatus, scheduledDeliverySlot, scheduledDeliveryDate, note } = req.body;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Prepare update object
    const updateData = {};
    const statusHistoryEntries = [];

    // Validate and update orderStatus if provided
    if (status) {
      const validOrderStatuses = ["CREATED", "PLACED", "SHIPPED", "CANCELLED", "EXPIRED"];
      // Note: "DELIVERED" is removed from valid statuses for manual admin updates
      // It should only be set automatically when both payment and delivery are complete

      if (!validOrderStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validOrderStatuses.join(", ")}`
        });
      }

      // Business rule validation
      if (status === "SHIPPED" && order.deliveryStatus !== "IN_TRANSIT") {
        return res.status(400).json({
          success: false,
          message: "Cannot set order status to SHIPPED unless delivery status is IN_TRANSIT"
        });
      }

      updateData.orderStatus = status;
      statusHistoryEntries.push({
        status: status,
        at: new Date(),
        by: "ADMIN",
        note: note || `Order status updated to ${status}`
      });
    }

    // Validate and update deliveryStatus if provided
    if (deliveryStatus) {
      const validDeliveryStatuses = ["NOT_STARTED", "IN_TRANSIT", "DELIVERED", "DELAYED"];
      if (!validDeliveryStatuses.includes(deliveryStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid deliveryStatus. Must be one of: ${validDeliveryStatuses.join(", ")}`
        });
      }

      // Auto-sync logic: When deliveryStatus changes to DELIVERED, auto-set orderStatus to DELIVERED if payment is PAID
      if (deliveryStatus === "DELIVERED" && order.paymentStatus === "PAID" && order.orderStatus !== "DELIVERED") {
        updateData.orderStatus = "DELIVERED";
        statusHistoryEntries.push({
          status: "DELIVERED",
          at: new Date(),
          by: "SYSTEM",
          note: "Order automatically marked as delivered (payment paid and delivery completed)"
        });
      }

      updateData.deliveryStatus = deliveryStatus;
    }

    // Update scheduledDeliverySlot if provided
    if (scheduledDeliverySlot !== undefined) {
      updateData.scheduledDeliverySlot = scheduledDeliverySlot;
    }

    // Update scheduledDeliveryDate if provided
    if (scheduledDeliveryDate !== undefined) {
      updateData.scheduledDeliveryDate = new Date(scheduledDeliveryDate);
    }

    // Add status history entries
    if (statusHistoryEntries.length > 0) {
      updateData.$push = { statusHistory: { $each: statusHistoryEntries } };
    }

    // Update the order using findOneAndUpdate to avoid validation issues
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      updateData,
      { new: true, runValidators: false } // Skip validation for existing required fields
    );

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message
    });
  }
};



// Get user-friendly order status
export const getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check authorization
    if (req.user && order.userId && order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order"
      });
    }

    if (!req.user && order.guestId !== req.query.guestId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order"
      });
    }

    // Determine user-friendly status based on backend states
    let primaryStatus = "";
    let deliveryMessage = "";
    let estimatedDelivery = order.estimatedDeliveryTime ? new Date(order.estimatedDeliveryTime).toLocaleString() : null;

    if (order.orderStatus === "PLACED" && order.deliveryStatus === "NOT_STARTED") {
      primaryStatus = "Order Confirmed";
      deliveryMessage = "Preparing your order";
      if (estimatedDelivery) {
        deliveryMessage += `. Estimated delivery by ${estimatedDelivery}`;
      }
      deliveryMessage += ". (Delivery time may vary due to traffic)";
    } else if (order.orderStatus === "SHIPPED") {
      primaryStatus = "Out for Delivery";
      deliveryMessage = "Your order is on the way";
    } else if (order.deliveryStatus === "DELAYED") {
      primaryStatus = "Delayed due to traffic";
      deliveryMessage = "We're working to get your order to you as soon as possible";
    } else if (order.orderStatus === "DELIVERED") {
      primaryStatus = "Delivered";
      deliveryMessage = "Enjoy your fresh order 🥩";
    } else if (order.orderStatus === "CANCELLED") {
      primaryStatus = "Cancelled";
      deliveryMessage = "Your order has been cancelled";
    }

    res.status(200).json({
      success: true,
      data: {
        primaryStatus,
        deliveryMessage,
        estimatedDelivery,
        statusHistory: order.statusHistory.map(h => ({
          status: h.status,
          at: h.timestamp,
          note: h.note
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching order status",
      error: error.message
    });
  }
};

// Get admin order status (admin only)
export const getAdminOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Determine admin status
    let adminStatus = "";
    let availableActions = [];

    if (order.paymentStatus === "PAID" && order.orderStatus === "PLACED" && order.deliveryStatus === "NOT_STARTED") {
      adminStatus = "PAID – Waiting for Pickup";
      availableActions = ["Mark as Shipped", "Mark as Delayed", "Cancel Order"];
    } else if (order.orderStatus === "SHIPPED" && order.deliveryStatus === "IN_TRANSIT") {
      adminStatus = "Out for Delivery";
      availableActions = ["Mark as Delivered", "Mark as Delayed"];
    } else if (order.deliveryStatus === "DELAYED") {
      adminStatus = "Delayed";
      availableActions = ["Mark as Delivered", "Cancel Order"];
    } else if (order.orderStatus === "DELIVERED") {
      adminStatus = "Delivered";
      availableActions = [];
    } else if (order.orderStatus === "CANCELLED") {
      adminStatus = "Cancelled";
      availableActions = [];
    }

    res.status(200).json({
      success: true,
      data: {
        adminStatus,
        availableActions,
        currentStates: {
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          deliveryStatus: order.deliveryStatus
        },
        statusHistory: order.statusHistory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching admin order status",
      error: error.message
    });
  }
};

// Razorpay webhook handler
export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload.payment.entity;

    if (event === 'payment.captured') {
      // Find order by Razorpay order ID
      const order = await Order.findOne({ razorpayOrderId: paymentEntity.order_id });
      if (order) {
        // Re-check delivery eligibility before confirming order
        if (order.address) {
          const eligibilityCheck = verifyDeliveryEligibility(order.address);
          if (!eligibilityCheck.eligible) {
            // Cancel the order if delivery is no longer available
            order.status = 'CANCELLED';
            if (order.paymentId) {
              order.paymentId.status = 'REFUNDED'; // Mark for refund
              await order.paymentId.save();
            }
            await order.save();
            // TODO: Implement refund logic here
            return res.status(200).json({ success: true });
          }
        }

        order.orderStatus = 'PLACED';
        order.deliveryStatus = 'NOT_STARTED';
        if (order.paymentId) {
          order.paymentId.status = 'VERIFIED';
          await order.paymentId.save();
        }
        await order.save();
      }
    } else if (event === 'payment.failed') {
      const order = await Order.findOne({ razorpayOrderId: paymentEntity.order_id });
      if (order) {
        order.status = 'CANCELLED';
        order.orderStatus = 'CANCELLED';
        if (order.paymentId) {
          order.paymentId.status = 'FAILED';
          await order.paymentId.save();
        }
        await order.save();
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
      error: error.message
    });
  }
};
