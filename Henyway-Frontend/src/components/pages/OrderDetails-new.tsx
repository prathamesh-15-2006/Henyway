import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Truck, CheckCircle, MapPin, MessageSquare, Phone, HelpCircle } from 'lucide-react';
import { getOrder } from '../../Services/Order-api';
import { submitIssue, getIssueStatus, Issue } from '../../Services/OrderIssues-api';
import { Order } from '../types';
import { Timeline } from './Timeline';

export const OrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Issue related state
  const [issue, setIssue] = useState<Issue | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({
    issueType: '',
    message: ''
  });
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);

  // Helper functions
  const isSupportDisabled = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour < 9 || hour >= 21; // 9am to 9pm
  };

  const handleSubmitIssue = async () => {
    if (!issueForm.issueType) {
      setIssueError('Please select an issue type');
      return;
    }

    setSubmittingIssue(true);
    setIssueError(null);
    setIssueSuccess(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await submitIssue({
        orderId: orderId!,
        issueType: issueForm.issueType,
        message: issueForm.message || undefined
      }, token);

      if (response.success) {
        setIssue(response.data);
        setIssueSuccess('Issue submitted successfully. We will contact you shortly.');
        setShowIssueModal(false);
        setIssueForm({ issueType: '', message: '' });
      } else {
        setIssueError(response.message || 'Failed to submit issue');
      }
    } catch (error: any) {
      setIssueError(error.message || 'Failed to submit issue');
    } finally {
      setSubmittingIssue(false);
    }
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;

      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await getOrder(orderId, token);
        const orderData = response.data || response;

        const mappedOrder: Order = {
          id: orderData.orderId,
          userId: orderData.userId?._id || orderData.userId || '',
          items: (orderData.items || []).map((item: any) => ({
            productId: typeof item.productId === 'object' ? item.productId._id : item.productId,
            productName: item.name,
            quantity: item.quantity || 0,
            price: item.price || 0,
          })),
          total: orderData.totalAmount || 0,
          status: orderData.status,
          createdAt: orderData.createdAt,
          shippingAddress: orderData.address ? {
            fullName: orderData.address.name,
            mobile: orderData.address.phone,
            address: orderData.address.addressLine,
            city: orderData.address.city,
            state: orderData.address.state,
            pincode: orderData.address.pincode,
          } : {
            fullName: '',
            mobile: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
          },
          statusHistory: orderData.statusHistory || [],
          orderStatus: orderData.orderStatus,
          deliveryStatus: orderData.deliveryStatus,
        };

        setOrder(mappedOrder);
      } catch (error) {
        console.error("Failed to fetch order details:", error);
        setError("Failed to load order details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  // Check for existing issues
  useEffect(() => {
    const checkExistingIssue = async () => {
      if (!orderId) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await getIssueStatus(orderId, token);
        if (response.success && response.data) {
          setIssue(response.data);
        }
      } catch (error) {
        console.error("Failed to check issue status:", error);
      }
    };

    checkExistingIssue();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error || 'Order not found'}</div>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-amber-600 hover:text-amber-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Orders</span>
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
                <p className="text-gray-600">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold`}>
                  {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1).replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Tracking</h2>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <Timeline order={order} />
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <Package className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">₹{item.price.toLocaleString()} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-gray-900">
                  ₹{order.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
                <p className="text-gray-600">{order.shippingAddress.mobile}</p>
                <p className="text-gray-600">
                  {order.shippingAddress.address}, {order.shippingAddress.city}
                </p>
                <p className="text-gray-600">
                  {order.shippingAddress.state} - {order.shippingAddress.pincode}
                </p>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div className="bg-white rounded-xl shadow-md p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help with this Order?</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowIssueModal(true)}
                disabled={!!issue || isSupportDisabled()}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  issue || isSupportDisabled()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>Report an Issue</span>
              </button>

              <a
                href="https://wa.me/1234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                <span>WhatsApp Us</span>
              </a>

              <a
                href="tel:+1234567890"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span>Call Us</span>
              </a>
            </div>

            {isSupportDisabled() && (
              <p className="text-sm text-gray-500 mt-3">
                Support available from 9am – 9pm
              </p>
            )}

            {issue && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Issue Status: {issue.status}</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Submitted on {new Date(issue.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
            )}

            {issueSuccess && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{issueSuccess}</p>
              </div>
            )}

            {issueError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{issueError}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Issue Report Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report an Issue</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Type *
                </label>
                <select
                  value={issueForm.issueType}
                  onChange={(e) => setIssueForm({ ...issueForm, issueType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">Select an issue type</option>
                  <option value="Order late">Order late</option>
                  <option value="Wrong item">Wrong item</option>
                  <option value="Quality issue">Quality issue</option>
                  <option value="Payment issue">Payment issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={issueForm.message}
                  onChange={(e) => setIssueForm({ ...issueForm, message: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={3}
                  placeholder="Please describe your issue..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowIssueModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submittingIssue}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitIssue}
                disabled={submittingIssue}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {submittingIssue ? 'Submitting...' : 'Submit Issue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
