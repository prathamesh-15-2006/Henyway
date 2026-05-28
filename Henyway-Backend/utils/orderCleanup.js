import Order from "../models/Order.js";

export const cleanupExpiredOrders = async () => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

    const result = await Order.updateMany(
      {
        status: { $in: ["CREATED", "PENDING_PAYMENT"] },
        createdAt: { $lt: thirtyMinutesAgo }
      },
      {
        status: "EXPIRED",
        updatedAt: new Date()
      }
    );

    console.log(`Cleaned up ${result.modifiedCount} expired orders`);
    return result.modifiedCount;
  } catch (error) {
    console.error("Error cleaning up expired orders:", error);
    throw error;
  }
};
