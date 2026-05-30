import api from './api';

export interface Address {
  name: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  source: 'AUTO' | 'MANUAL';
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

export interface OrderData {
  orderId: string;
  userId?: string;
  guestId?: string;
  items: OrderItem[];
  totalAmount: number;
  address?: Address;
  status: string;
  razorpayOrderId?: string;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RazorpayOrderData {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
}

export interface PaymentVerificationData {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export const createOrder = async (_token: string): Promise<any> => {
  try {
    const response = await api.post('/api/orders/create');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Create order failed';
    throw new Error(message);
  }
};

export const updateOrderAddress = async (orderId: string, address: any, _token: string): Promise<any> => {
  try {
    const response = await api.put(`/api/orders/${orderId}/address`, { address });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Update order address failed';
    throw new Error(message);
  }
};

export const createRazorpayOrder = async (orderId: string, _token: string): Promise<any> => {
  try {
    const response = await api.post(`/api/orders/${orderId}/razorpay`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Create Razorpay order failed';
    throw new Error(message);
  }
};

export const verifyPayment = async (paymentData: PaymentVerificationData, _token: string): Promise<any> => {
  try {
    const response = await api.post('/api/orders/verify-payment', paymentData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Payment verification failed';
    throw new Error(message);
  }
};

export const getOrder = async (orderId: string, _token?: string): Promise<any> => {
  try {
    const response = await api.get(`/api/orders/${orderId}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Get order failed';
    throw new Error(message);
  }
};

export const getOrders = async (_token: string): Promise<any> => {
  try {
    const response = await api.get('/api/orders');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Get orders failed';
    throw new Error(message);
  }
};

export const getAllAdminOrders = async (_token: string): Promise<any> => {
  try {
    const response = await api.get('/api/orders/admin/all');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Get admin orders failed';
    throw new Error(message);
  }
};

export const updateOrderStatus = async (orderId: string, status?: string, deliveryStatus?: string, _token?: string): Promise<any> => {
  const body: any = {};
  if (status !== undefined) body.status = status;
  if (deliveryStatus !== undefined) body.deliveryStatus = deliveryStatus;

  try {
    const response = await api.put(`/api/orders/${orderId}/status`, body);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Update order status failed';
    throw new Error(message);
  }
};
