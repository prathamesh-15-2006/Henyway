import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  }
});

const addressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  addressLine: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ["AUTO", "MANUAL", "GPS"],
    required: true
  },
  // GPS coordinates for location verification
  latitude: {
    type: Number,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    min: -180,
    max: 180
  },
  // Backend verification results
  verifiedArea: {
    type: String
  },
  verificationConfidence: {
    type: String,
    enum: ["high", "medium", "low", "manual", "fallback"]
  },
  geocodingData: {
    type: mongoose.Schema.Types.Mixed // Store raw geocoding response for debugging
  }
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  guestId: {
    type: String
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  address: addressSchema,
  // Main order lifecycle status
  orderStatus: {
    type: String,
    enum: ["CREATED", "PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "EXPIRED"],
    default: "CREATED"
  },
  // Payment status
  paymentStatus: {
    type: String,
    enum: ["PENDING_PAYMENT", "PAID", "REFUNDED"],
    default: "PENDING_PAYMENT"
  },
  // Delivery status
  deliveryStatus: {
    type: String,
    enum: ["NOT_STARTED", "IN_TRANSIT", "DELAYED", "DELIVERED"],
    default: "NOT_STARTED"
  },
  // Delivery-related fields
  deliveryType: {
    type: String,
    enum: ["ASAP", "SCHEDULED"],
    default: "ASAP"
  },
  scheduledDeliveryTime: {
    type: Date
  },
  estimatedDeliveryTime: {
    type: Date
  },
  delayReason: {
    type: String,
    enum: ["TRAFFIC", "WEATHER", "OTHER"]
  },
  isSameDayDelivery: {
    type: Boolean,
    default: true
  },
  scheduledDeliveryDate: {
    type: Date,
    required: true
  },
  scheduledDeliverySlot: {
    type: String,
    required: true
  },
  razorpayOrderId: {
    type: String
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment"
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ["CREATED", "PENDING_PAYMENT", "PAID", "PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "EXPIRED", "DELAYED", "SCHEDULED", "OUT_FOR_DELIVERY"],
      required: true
    },
    at: {
      type: Date,
      default: Date.now
    },
    by: {
      type: String,
      enum: ["SYSTEM", "ADMIN", "USER"],
      default: "SYSTEM"
    },
    note: {
      type: String
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique order ID before saving and track status changes
orderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderId) {
    this.orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    // Initialize status history for new orders
    this.statusHistory = [{
      status: this.orderStatus,
      at: new Date(),
      by: "SYSTEM",
      note: 'Order created'
    }];
  }

  // Track orderStatus changes
  if (this.isModified('orderStatus') && !this.isNew) {
    const previousStatus = this.getChanges().$set?.orderStatus || this.orderStatus;
    if (previousStatus !== this.orderStatus) {
      this.statusHistory.push({
        status: this.orderStatus,
        at: new Date(),
        by: "SYSTEM",
        note: `Order status changed to ${this.orderStatus}`
      });
    }
  }

  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Order", orderSchema);
