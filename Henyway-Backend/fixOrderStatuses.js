import mongoose from 'mongoose';
import Order from './models/Order.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/henway';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration script to fix broken order statuses
const fixOrderStatuses = async () => {
  try {
    console.log('Starting order status migration...');

    // Find orders with DELIVERED status but PENDING_PAYMENT
    const brokenOrders = await Order.find({
      orderStatus: 'DELIVERED',
      paymentStatus: { $ne: 'PAID' }
    });

    console.log(`Found ${brokenOrders.length} orders with DELIVERED status but unpaid payment`);

    let fixedCount = 0;

    for (const order of brokenOrders) {
      console.log(`Fixing order ${order.orderId}: DELIVERED + ${order.paymentStatus} + ${order.deliveryStatus}`);

      // Reset to appropriate state based on payment and delivery status
      if (order.paymentStatus === 'PENDING_PAYMENT') {
        // Payment not made, reset to CREATED
        order.orderStatus = 'CREATED';
        order.deliveryStatus = 'NOT_STARTED';
      } else if (order.deliveryStatus !== 'DELIVERED') {
        // Payment made but delivery not complete, set to CONFIRMED
        order.orderStatus = 'CONFIRMED';
        order.deliveryStatus = 'NOT_STARTED';
      }

      // Add status history entry
      order.statusHistory.push({
        status: order.orderStatus,
        at: new Date(),
        by: 'SYSTEM',
        note: 'Status corrected during migration - DELIVERED status was invalid'
      });

      await order.save();
      fixedCount++;
    }

    // Find orders with SHIPPED status but delivery not started
    const shippedWithoutDelivery = await Order.find({
      orderStatus: 'SHIPPED',
      deliveryStatus: 'NOT_STARTED'
    });

    console.log(`Found ${shippedWithoutDelivery.length} orders with SHIPPED status but delivery not started`);

    for (const order of shippedWithoutDelivery) {
      console.log(`Fixing order ${order.orderId}: SHIPPED but delivery NOT_STARTED`);

      // Reset to CONFIRMED since delivery hasn't started
      order.orderStatus = 'CONFIRMED';

      order.statusHistory.push({
        status: 'CONFIRMED',
        at: new Date(),
        by: 'SYSTEM',
        note: 'Status corrected during migration - SHIPPED status was invalid when delivery not started'
      });

      await order.save();
      fixedCount++;
    }

    console.log(`Migration completed. Fixed ${fixedCount} orders.`);

    // Summary statistics
    const stats = await Order.aggregate([
      {
        $group: {
          _id: { orderStatus: '$orderStatus', paymentStatus: '$paymentStatus', deliveryStatus: '$deliveryStatus' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log('\nOrder status distribution after migration:');
    stats.forEach(stat => {
      console.log(`${stat._id.orderStatus} + ${stat._id.paymentStatus} + ${stat._id.deliveryStatus}: ${stat.count} orders`);
    });

  } catch (error) {
    console.error('Migration failed:', error);
  }
};

// Run the migration
const runMigration = async () => {
  await connectDB();
  await fixOrderStatuses();
  await mongoose.disconnect();
  console.log('Migration script completed');
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export default fixOrderStatuses;
