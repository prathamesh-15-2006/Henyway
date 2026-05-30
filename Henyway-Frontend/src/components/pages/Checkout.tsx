import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin, Edit, Loader2, Navigation } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { ShippingAddress } from '../types';
import { motion } from 'framer-motion';
import { createOrder, updateOrderAddress, createRazorpayOrder, verifyPayment } from '../../Services/Order-api';
import { getProfile } from '../../Services/Auth-api';
import { checkPincodeEligibility } from '../../Services/Delivery-api';

export const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { deliveryArea, isDeliveryEligible, coordinates, locationSource, setShowLocationPopup } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [addressSource, setAddressSource] = useState<'AUTO' | 'MANUAL'>('MANUAL');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [deliveryType, setDeliveryType] = useState<'ASAP' | 'SCHEDULED'>('ASAP');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [isOrderTimeValid, setIsOrderTimeValid] = useState<boolean>(true);
  const [orderBlocked, setOrderBlocked] = useState<boolean>(false);

  // Allowed delivery areas for display
  const ALLOWED_AREAS = [
    'Mundhwa', 'Hadapsar', 'Kharadi', 'Kalyani nagar', 'Wagholi', 'Lohegao',
    'Viman nagar', 'Vishrantwadi', 'Manjari', 'Koregaon park', 'Magarpatta',
    'Undri', 'Kondhwa', 'Swarget'
  ];

  // Validation functions
  const validateFullName = (value: string) => {
    if (!value.trim()) return 'Full name is required';
    if (value.trim().length < 2) return 'Full name must be at least 2 characters';
    if (!/^[a-zA-Z\s]+$/.test(value.trim())) return 'Full name can only contain letters and spaces';
    return '';
  };

  const validateMobile = (value: string) => {
    if (!value.trim()) return 'Mobile number is required';
    if (!/^[6-9]\d{9}$/.test(value.trim())) return 'Enter a valid 10-digit mobile number starting with 6-9';
    return '';
  };

  const validateAddress = (value: string) => {
    if (!value.trim()) return 'Address is required';
    if (value.trim().length < 10) return 'Address must be at least 10 characters';
    return '';
  };

  const validateCity = (value: string) => {
    if (!value.trim()) return 'City is required';
    if (!/^[a-zA-Z\s]+$/.test(value.trim())) return 'City can only contain letters and spaces';
    return '';
  };

  const validateState = (value: string) => {
    if (!value.trim()) return 'State is required';
    if (value.trim().toLowerCase() !== 'maharashtra') return 'State must be Maharashtra';
    return '';
  };

  const validatePincode = (value: string) => {
    if (!value.trim()) return 'Pincode is required';
    if (!/^\d{6}$/.test(value.trim())) return 'Pincode must be exactly 6 digits';
    return '';
  };

  const [formData, setFormData] = useState<ShippingAddress>({
    fullName: user?.name || '',
    mobile: user?.mobile || '',
    address: '',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '',
  });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch user profile and populate form data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const responseData = await getProfile();
        const userProfile = responseData.user || responseData;

        setFormData({
          fullName: userProfile.username || user?.name || '',
          mobile: userProfile.phone || userProfile.mobile || user?.mobile || '',
          address: userProfile.address?.addressLine || '',
          city: userProfile.address?.city || 'Pune',
          state: userProfile.address?.state || 'Maharashtra',
          pincode: userProfile.address?.pincode || '',
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // Fallback to user context data if profile fetch fails
        setFormData({
          fullName: user?.name || '',
          mobile: user?.mobile || '',
          address: '',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '',
        });
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Check current time and validate order time
  useEffect(() => {
    const checkOrderTime = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Orders accepted between 9 AM - 9 PM
      const isValidTime = currentHour >= 9 && currentHour < 21; // 9 AM to 9 PM

      setIsOrderTimeValid(isValidTime);
      setOrderBlocked(!isValidTime);
    };

    checkOrderTime();
    // Check every minute
    const interval = setInterval(checkOrderTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Determine delivery availability and slots
  const getDeliveryInfo = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Case A: Time is 9:00 AM – 9:00 PM (Same-day delivery)
    if (currentHour >= 9 && currentHour < 21) {
      return {
        type: 'same-day',
        message: '✅ Same-day delivery available',
        slots: generateSameDaySlots(),
        showTodaySlots: true,
        showTomorrowSlots: false
      };
    }

    // Case B: Time is After 9:00 PM (Next-day delivery)
    if (currentHour >= 21) {
      return {
        type: 'next-day',
        message: '⏰ Orders placed now will be delivered tomorrow',
        slots: generateNextDaySlots(),
        showTodaySlots: false,
        showTomorrowSlots: true
      };
    }

    // Case C: Time is Before 9:00 AM (Early morning - show today slots starting from 9 AM)
    return {
      type: 'early-morning',
      message: '⏰ Delivery starts at 9:00 AM',
      slots: generateSameDaySlots(),
      showTodaySlots: true,
      showTomorrowSlots: false
    };
  };

  const deliveryInfo = getDeliveryInfo();

  // Generate same-day delivery slots (9 AM - 9 PM)
  function generateSameDaySlots() {
    const options = [];
    const now = new Date();

    // Minimum time = current time + 1 hour, rounded up to next 30-minute interval
    let minTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
    const minutes = minTime.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 30) * 30;
    minTime.setMinutes(roundedMinutes);
    if (roundedMinutes === 60) {
      minTime.setHours(minTime.getHours() + 1);
      minTime.setMinutes(0);
    }
    const minHour = Math.max(minTime.getHours(), 9);

    // Maximum time = 9 PM
    const maxHour = 21; // 9 PM

    for (let hour = minHour; hour <= maxHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip if this time is before minimum time
        if (hour < minTime.getHours() || (hour === minTime.getHours() && minute < minTime.getMinutes())) continue;

        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-IN', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        options.push(
          <option key={timeString} value={timeString}>
            {displayTime}
          </option>
        );
      }
    }

    return options;
  }

  // Generate next-day delivery slots (9 AM - 9 PM tomorrow)
  function generateNextDaySlots() {
    const options = [];

    // Next day slots: 9 AM - 9 PM
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-IN', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        options.push(
          <option key={timeString} value={timeString}>
            Tomorrow {displayTime}
          </option>
        );
      }
    }

    return options;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const trimmedValue = value.trim();

    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time validation
    let error = '';
    switch (name) {
      case 'fullName':
        error = validateFullName(trimmedValue);
        break;
      case 'mobile':
        error = validateMobile(trimmedValue);
        break;
      case 'address':
        error = validateAddress(trimmedValue);
        break;
      case 'city':
        error = validateCity(trimmedValue);
        break;
      case 'state':
        error = validateState(trimmedValue);
        break;
      case 'pincode':
        error = validatePincode(trimmedValue);
        break;
      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate all fields before submission
    const newErrors: { [key: string]: string } = {};
    newErrors.fullName = validateFullName(formData.fullName.trim());
    newErrors.mobile = validateMobile(formData.mobile.trim());
    newErrors.address = validateAddress(formData.address.trim());
    newErrors.city = validateCity(formData.city.trim());
    newErrors.state = validateState(formData.state.trim());
    newErrors.pincode = validatePincode(formData.pincode.trim());

    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    if (hasErrors) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setPopupMessage('Please login to place an order');
      setShowPopup(true);
      return;
    }

    setLoading(true);
    try {
      // Step 0: Verify Delivery Eligibility
      const verifyData = await checkPincodeEligibility(formData.pincode, formData.address);

      if (!verifyData.eligible) {
        setPopupMessage(verifyData.reason || 'Sorry, we currently do not deliver to this pincode');
        setShowPopup(true);
        setLoading(false);
        return;
      }

      // Step 1: Create temporary order from cart
      const orderResponse = await createOrder(token);
      const order = orderResponse.data;
      setCurrentOrder(order);
      setOrderId(order.orderId);

      // Step 2: Update order with address and delivery preferences
      const addressData = {
        name: formData.fullName,
        phone: formData.mobile,
        email: user.email || '',
        addressLine: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: 'India',
        source: addressSource,
        // Include location data if available
        ...(coordinates && {
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          detectedArea: deliveryArea,
          locationSource: locationSource
        }),
        // Add delivery preferences
        deliveryType: deliveryType,
        scheduledDeliverySlot: deliveryType === 'SCHEDULED' ? scheduledTime : 'ASAP',
        scheduledDeliveryDate: deliveryType === 'SCHEDULED' ?
          (deliveryInfo.showTodaySlots ? new Date().toISOString().split('T')[0] :
            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
        // Set initial order status and delivery status to match backend enums
        orderStatus: 'CREATED',
        deliveryStatus: 'PENDING'
      };

      await updateOrderAddress(order.orderId, addressData, token);

      // Step 3: Create Razorpay order
      const razorpayResponse = await createRazorpayOrder(order.orderId, token);
      const razorpayData = razorpayResponse.data;

      // Step 4: Open Razorpay checkout
      const options = {
        key: razorpayData.key,
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        name: 'Henway E-commerce',
        description: 'Order Payment',
        order_id: razorpayData.razorpayOrderId,
        handler: async (response: any) => {
          try {
            // Step 5: Verify payment
            await verifyPayment({
              orderId: order.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            }, token);

            setOrderPlaced(true);
            clearCart();
          } catch (error) {
            console.error('Payment verification failed:', error);
            setPopupMessage('Payment verification failed. Please contact support.');
            setShowPopup(true);
          }
        },
        prefill: {
          name: formData.fullName,
          email: user.email,
          contact: formData.mobile
        },
        theme: {
          color: '#f59e0b'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error('Order creation failed:', error);
      setPopupMessage(error.message || 'Failed to create order. Please try again.');
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order Placed Successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for your order. Your order ID is{' '}
              <span className="font-semibold text-amber-600">{orderId}</span>
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-gray-700">
                We've sent a confirmation to your registered mobile number.
                You can track your order from your dashboard.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors"
              >
                View Orders
              </button>
              <button
                onClick={() => navigate('/products')}
                className="bg-white border-2 border-amber-600 text-amber-600 px-8 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Delivery Location Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Delivery Location
              </h2>

              {/* Delivery Areas Information */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-green-800 mb-2">
                      🚚 We Deliver To These Areas
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-green-700">
                      {ALLOWED_AREAS.map((area) => (
                        <span key={area} className="bg-green-100 px-2 py-1 rounded-md text-center">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Location Display */}
              {deliveryArea ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">
                        Current Location: {deliveryArea}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLocationPopup(true)}
                      className="text-blue-600 text-sm font-medium hover:text-blue-800 flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Change
                    </button>
                  </div>

                  {isDeliveryEligible ? (
                    <p className="text-green-700 text-sm font-medium mt-2">
                      ✅ Delivery available in your area
                    </p>
                  ) : (
                    <p className="text-red-700 text-sm font-medium mt-2">
                      ⚠️ Sorry, we currently deliver only in selected areas. We deliver to: {ALLOWED_AREAS.join(', ')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowLocationPopup(true)}
                    className="flex items-center gap-3 w-full px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Navigation className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-700 font-medium">
                      Set Delivery Location
                    </span>
                  </button>

                  <div className="text-xs text-gray-500">
                    <p>
                      💡 <strong>Note:</strong> Please set your delivery location to ensure we can deliver to your area.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Time Selection */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Delivery Time
              </h2>

              {/* Time-based Delivery Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 text-sm font-medium">
                  {deliveryInfo.message}
                </p>
              </div>

              {/* Time Validation Message */}
              {!isOrderTimeValid && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 text-sm">
                    ❌ Orders are closed for today. Please order tomorrow after 9 AM.
                  </p>
                </div>
              )}

              {isOrderTimeValid && (
                <div className="space-y-4">
                  {/* ASAP Option */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="asap"
                      name="deliveryType"
                      value="ASAP"
                      checked={deliveryType === 'ASAP'}
                      onChange={(e) => setDeliveryType(e.target.value as 'ASAP' | 'SCHEDULED')}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="asap" className="text-sm font-medium text-gray-900">
                      As soon as possible
                    </label>
                    <span className="text-xs text-gray-500">(Within 1 hour)</span>
                  </div>

                  {/* Scheduled Option */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="scheduled"
                        name="deliveryType"
                        value="SCHEDULED"
                        checked={deliveryType === 'SCHEDULED'}
                        onChange={(e) => setDeliveryType(e.target.value as 'ASAP' | 'SCHEDULED')}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                      />
                      <label htmlFor="scheduled" className="text-sm font-medium text-gray-900">
                        Schedule delivery
                      </label>
                      <span className="text-xs text-gray-500">
                        ({deliveryInfo.showTodaySlots ? 'Today' : 'Tomorrow'}, 9 AM - 9 PM)
                      </span>
                    </div>

                    {deliveryType === 'SCHEDULED' && (
                      <div className="ml-7">
                        <select
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        >
                          <option value="">Select delivery time</option>
                          {deliveryInfo.slots}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Delivery Time Display */}
              {deliveryType === 'SCHEDULED' && scheduledTime && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-800 text-sm font-medium">
                    🚚 Delivery is scheduled for {scheduledTime}
                  </p>
                  <p className="text-amber-700 text-xs mt-1">
                    ⏱️ Delivery time is estimated and may vary due to traffic
                  </p>
                </div>
              )}

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  ⚠️ Delivery may be delayed due to traffic conditions
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Shipping Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${errors.fullName ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${errors.mobile ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder="House No., Building Name, Street"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled
                    required
                    className={`w-full px-4 py-3 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed ${errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}

                    required
                    className={`w-full px-4 py-3 border rounded-lg bg-grey-100 text-black-500 cursor-not-allowed ${errors.state ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${errors.pincode ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || Object.values(errors).some(error => error !== '')}
                className="w-full mt-8 bg-gradient-to-r from-amber-600 to-orange-500 text-white py-4 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <p className="text-gray-800 mb-4">{popupMessage}</p>
            <button
              onClick={() => setShowPopup(false)}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
