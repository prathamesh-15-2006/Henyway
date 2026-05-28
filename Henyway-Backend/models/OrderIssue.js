import mongoose from "mongoose";

const orderIssueSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true // Ensures only 1 issue per order
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  issueType: {
    type: String,
    required: true,
    enum: ["Order late", "Wrong item", "Quality issue", "Payment issue", "Other"]
  },
  message: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ["OPEN", "RESOLVED"],
    default: "OPEN"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    required: false
  }
});

// TTL index: automatically delete resolved issues after 72 hours
orderIssueSchema.index(
  { resolvedAt: 1 },
  { expireAfterSeconds: 72 * 60 * 60, partialFilterExpression: { status: "RESOLVED" } }
);

export default mongoose.model("OrderIssue", orderIssueSchema);
