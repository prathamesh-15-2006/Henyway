export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  images: string[];
  stock?: number;
  featured: boolean;
  newArrival: boolean;
  active: boolean;
  rating?: number;
  reviews?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  active: boolean;
  link?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: string; // Legacy status field
  createdAt: string;
  shippingAddress: ShippingAddress;
  statusHistory?: {
    status: string;
    timestamp: string;
    note?: string;
  }[];
  orderStatus: string; // Order lifecycle status (CREATED, PLACED, SHIPPED, DELIVERED, CANCELLED, EXPIRED)
  paymentStatus: string; // Payment status (PENDING_PAYMENT, PAID, REFUNDED)
  deliveryStatus: string; // Delivery status (NOT_STARTED, IN_TRANSIT, DELIVERED, DELAYED)
  estimatedDeliveryTime?: string;
  delayReason?: string;
}

export interface ShippingAddress {
  fullName: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface User {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  role: 'user' | 'admin';
  createdAt: string;
}
