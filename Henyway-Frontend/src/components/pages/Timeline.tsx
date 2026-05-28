import {
  Check,
  Package,
  Truck,
  Home,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { Order } from '../types';

interface TimelineProps {
  order: Order;
}

export const Timeline = ({ order }: TimelineProps) => {
  const isCancelled = order.orderStatus === 'CANCELLED';
  const isRefunded = order.orderStatus === 'REFUNDED';

  const timelineConfig = isCancelled
    ? [
        {
          status: 'PLACED',
          title: 'Order Placed',
          description: 'We have received your order.',
          icon: <Package className="w-5 h-5" />,
        },
        {
          status: 'CANCELLED',
          title: 'Order Cancelled',
          description: 'This order was cancelled.',
          icon: <XCircle className="w-5 h-5" />,
        },
        ...(isRefunded
          ? [
              {
                status: 'REFUNDED',
                title: 'Refund Completed',
                description: 'Refund has been processed.',
                icon: <RotateCcw className="w-5 h-5" />,
              },
            ]
          : []),
      ]
    : [
        {
          status: 'PLACED',
          title: 'Order Placed',
          description: 'We have received your order.',
          icon: <Package className="w-5 h-5" />,
        },
        {
          status: 'CONFIRMED',
          title: 'Order Confirmed',
          description: 'Your order has been confirmed.',
          icon: <Check className="w-5 h-5" />,
        },
        {
          status: 'SHIPPED',
          title: 'Shipped',
          description: 'Your order is on its way.',
          icon: <Truck className="w-5 h-5" />,
        },
        {
          status: 'DELIVERED',
          title: 'Delivered',
          description: 'Your order has been delivered.',
          icon: <Home className="w-5 h-5" />,
        },
      ];

  const currentStatusIndex = timelineConfig.findIndex(
    (item) => item.status === order.orderStatus
  );

  const totalSteps = timelineConfig.length;
  const progressPercent =
    totalSteps > 1
      ? (currentStatusIndex / (totalSteps - 1)) * 100
      : 0;

  return (
    <div className="relative">
      {/* Connector wrapper */}
      <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200" />

      {/* Progress connector */}
      {currentStatusIndex >= 0 && (
        <div
          className={`absolute left-5 top-5 w-0.5 transition-all duration-500
            ${
              isCancelled
                ? 'bg-red-500'
                : isRefunded
                ? 'bg-blue-500'
                : 'bg-green-500'
            }
          `}
          style={{
            height: `${progressPercent}%`,
          }}
        />
      )}

      <ul className="space-y-8 relative">
        {timelineConfig.map((item, index) => {
          const isCompleted = currentStatusIndex >= index;

          const statusHistory = order.statusHistory?.find(
            (h) => h.status === item.status
          );

          const timestamp = statusHistory
            ? new Date(statusHistory.at)
            : item.status === 'PLACED'
            ? new Date(order.createdAt)
            : null;

          return (
            <li key={item.status} className="flex items-start space-x-4">
              {/* Icon */}
              <div
                className={`z-10 w-10 h-10 flex items-center justify-center rounded-full
                  ${
                    isCompleted
                      ? item.status === 'CANCELLED'
                        ? 'bg-red-500 text-white'
                        : item.status === 'REFUNDED'
                        ? 'bg-blue-500 text-white'
                        : 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
              >
                {item.icon}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <h3
                  className={`font-semibold ${
                    isCompleted
                      ? item.status === 'CANCELLED'
                        ? 'text-red-600'
                        : item.status === 'REFUNDED'
                        ? 'text-blue-600'
                        : 'text-gray-900'
                      : 'text-gray-500'
                  }`}
                >
                  {item.title}
                </h3>

                <p className="text-sm text-gray-500">
                  {item.description}
                </p>

                {isCompleted && timestamp && !isNaN(timestamp.getTime()) && (
                  <p className="text-xs text-gray-400 mt-1">
                    {timestamp.toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
