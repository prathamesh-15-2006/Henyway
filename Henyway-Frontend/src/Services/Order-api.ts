import { apiConfig } from './api-config';

const BASE_URL = apiConfig.getBaseUrl();

interface Address {
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

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

interface OrderData {
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

interface RazorpayOrderData {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
}

interface PaymentVerificationData {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

class ApiError extends Error {
  response?: Response;
  data?: any;

  constructor(message: string, response?: Response, data?: any) {
    super(message);
    this.response = response;
    this.data = data;
  }
}

export const createOrder = async (token: string) => {
  const response = await fetch(`${BASE_URL}/api/orders/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Create order failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Create order failed', response, errorText);
    }
  }

  return response.json();
};

export const updateOrderAddress = async (orderId: string, address: Address, token: string) => {
  const response = await fetch(`${BASE_URL}/api/orders/${orderId}/address`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Update order address failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Update order address failed', response, errorText);
    }
  }

  return response.json();
};

export const createRazorpayOrder = async (orderId: string, token: string) => {
  const response = await fetch(`${BASE_URL}/api/orders/${orderId}/razorpay`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Create Razorpay order failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Create Razorpay order failed', response, errorText);
    }
  }

  return response.json();
};

export const verifyPayment = async (paymentData: PaymentVerificationData, token: string) => {
  const response = await fetch(`${BASE_URL}/api/orders/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Payment verification failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Payment verification failed', response, errorText);
    }
  }

  return response.json();
};

export const getOrder = async (orderId: string, token?: string) => {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Get order failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Get order failed', response, errorText);
    }
  }

  return response.json();
};

export const getOrders = async (token: string) => {
  const response = await fetch(`${BASE_URL}/api/orders`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Get orders failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Get orders failed', response, errorText);
    }
  }

  return response.json();
};

export const getAllAdminOrders = async (token: string) => {
  const response = await fetch(`${BASE_URL}/api/orders/admin/all`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Get admin orders failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Get admin orders failed', response, errorText);
    }
  }

  return response.json();
};

export const updateOrderStatus = async (orderId: string, status?: string, deliveryStatus?: string, token?: string) => {
  const body: any = {};
  if (status !== undefined) body.status = status;
  if (deliveryStatus !== undefined) body.deliveryStatus = deliveryStatus;

  const response = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Update order status failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Update order status failed', response, errorText);
    }
  }

  return response.json();
};
