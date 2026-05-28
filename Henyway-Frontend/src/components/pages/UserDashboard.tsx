import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, User, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { getProfile, updateProfile } from '../../Services/Auth-api';
import { getOrders } from '../../Services/Order-api';
import { Order } from '../types';

interface UserProfile {
  username: string;
  email: string;
  mobile?: string;
}

interface Address {
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  source: string;
}

export const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Separate state for editable fields
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<Address>({
    name: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    source: 'MANUAL'
  });
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      setError(null);
      try {
        const responseData = await getProfile();
        const userProfile = responseData.user || responseData;
        setProfile(userProfile);
        setUsername(userProfile.username || '');
        setPhone(userProfile.mobile || '');
        if (userProfile.address) {
          setAddress({
            name: userProfile.address.name || '',
            phone: userProfile.address.phone || '',
            addressLine: userProfile.address.addressLine || '',
            city: userProfile.address.city || '',
            state: userProfile.address.state || '',
            pincode: userProfile.address.pincode || '',
            country: userProfile.address.country || 'India',
            source: userProfile.address.source || 'MANUAL'
          });
        }
      } catch (error: any) {
        console.error("Failed to fetch profile:", error);
        if (error.data && error.data.message === "Invalid token" && error.data.error === "invalid signature") {
          logout();
          navigate('/login');
          return;
        }
        setError("Failed to load profile. Please try again later.");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true);
      setOrdersError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        const ordersResponse = await getOrders(token);
        const ordersArray = ordersResponse.data || ordersResponse;
        const mappedOrders: Order[] = ordersArray.map((orderData: any) => ({
          id: orderData.orderId,
          userId: orderData.userId?._id || orderData.userId || '',
          items: orderData.items.map((item: any) => ({
            productId: typeof item.productId === 'object' ? item.productId._id : item.productId,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          total: orderData.totalAmount,
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
          orderStatus: orderData.orderStatus || 'CREATED',
          paymentStatus: orderData.paymentStatus || 'PENDING_PAYMENT',
          deliveryStatus: orderData.deliveryStatus || 'NOT_STARTED',
          estimatedDeliveryTime: orderData.estimatedDeliveryTime || orderData.scheduledDeliveryDate,
          statusHistory: orderData.statusHistory || [],
        }));
        setOrders(mappedOrders);
      } catch (error: any) {
        console.error("Failed to fetch orders:", error);
        if (error.data && error.data.message === "Invalid token" && error.data.error === "invalid signature") {
          logout();
          navigate('/login');
          return;
        }
        setOrdersError("Failed to load orders. Please try again later.");
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, []);

  const getUserFriendlyStatus = (order: Order) => {
    switch (order.orderStatus) {
      case 'CREATED':
        return 'Order Placed';
      case 'PLACED':
        return 'Order Confirmed';
      case 'SHIPPED':
        return 'Out for Delivery';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Processing';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Order Placed':
        return 'bg-yellow-100 text-yellow-700';
      case 'Order Confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'Out for Delivery':
        return 'bg-purple-100 text-purple-700';
      case 'Delivered':
        return 'bg-green-100 text-green-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateSuccess('');
    setUpdateError('');

    try {
      const updateData: { username?: string; phone?: string; address?: Address } = {};

      if (username.trim()) {
        updateData.username = username.trim();
      }

      if (phone.trim()) {
        updateData.phone = phone.trim();
      }

      const hasAddressData = Object.values(address).some(value => value.trim() !== '');
      if (hasAddressData) {
        updateData.address = address;
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error('Please fill at least one field to update.');
      }

      await updateProfile(updateData);
      setUpdateSuccess('Profile updated successfully!');

      const responseData = await getProfile();
      const userProfile = responseData.user || responseData;
      setProfile(userProfile);
      setUsername(userProfile.username || '');
      setPhone(userProfile.mobile || '');
      if (userProfile.address) {
        setAddress({
          name: userProfile.address.name || '',
          phone: userProfile.address.phone || '',
          addressLine: userProfile.address.addressLine || '',
          city: userProfile.address.city || '',
          state: userProfile.address.state || '',
          pincode: userProfile.address.pincode || '',
          country: userProfile.address.country || 'India',
          source: userProfile.address.source || 'MANUAL'
        });
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      if (error.data && error.data.message === "Invalid token" && error.data.error === "invalid signature") {
        logout();
        navigate('/login');
        return;
      }
      setUpdateError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600">Welcome back, {profile?.username || '...'}!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-amber-100 p-3 rounded-full">
                  <User className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{profile?.username}</h3>
                  <p className="text-sm text-gray-600">{profile?.mobile || 'No mobile'}</p>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-amber-50 text-amber-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  <span className="font-medium">My Orders</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-amber-50 text-amber-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">Profile & Address</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3">
            {activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Order History</h2>

                  {loadingOrders ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600">Loading orders...</p>
                    </div>
                  ) : ordersError ? (
                    <div className="text-center py-12">
                      <div className="text-red-600 bg-red-50 p-4 rounded-lg">{ordersError}</div>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No orders yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          onClick={() => navigate(`/order/${order.id}`)}
                          className="border border-gray-200 rounded-lg p-4 hover:border-amber-300 transition-colors cursor-pointer"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">
                                Order #{order.id}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {order.items.length} item{order.items.length > 1 ? 's' : ''} • Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="flex items-center space-x-4 mt-2 md:mt-0">
                              <span className="text-lg font-bold text-gray-900">
                                ₹{order.total.toLocaleString()}
                              </span>
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                                  getUserFriendlyStatus(order)
                                )}`}
                              >
                                {getUserFriendlyStatus(order)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>

                  {loadingProfile ? (
                    <p className="text-gray-600">Loading profile...</p>
                  ) : error ? (
                    <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>
                  ) : (
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      {updateSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                          {updateSuccess}
                        </div>
                      )}

                      {updateError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                          {updateError}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username
                        </label>
                        <input
                          type="text"
                          value={username}
                          placeholder="Enter username"
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>

                    

                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={address.phone}
                              placeholder="Enter phone number"
                              onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>



                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Address Line
                            </label>
                            <input
                              type="text"
                              value={address.addressLine}
                              placeholder="Enter address"
                              onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City
                            </label>
                            <input
                              type="text"
                              value={address.city}
                              placeholder="Enter city"
                              onChange={(e) => setAddress({ ...address, city: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              State
                            </label>
                            <input
                              type="text"
                              value={address.state}
                              placeholder="Enter state"
                              onChange={(e) => setAddress({ ...address, state: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Pincode
                            </label>
                            <input
                              type="text"
                              value={address.pincode}
                              placeholder="Enter pincode"
                              onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Country
                            </label>
                            <input
                              type="text"
                              value={address.country}
                              disabled
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={updating}
                        className="bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating ? 'Updating...' : 'Update Profile'}
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
