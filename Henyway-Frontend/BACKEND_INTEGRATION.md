# Backend Integration Guide

This document provides guidance on integrating the Henyway frontend with your Node.js/Express/MongoDB backend.

## Current Setup

The application currently uses:
- **Static mock data** in `src/data/mockData.ts`
- **Context API** for state management (Auth & Cart)
- **localStorage** for persistence

## Backend Architecture to Implement

### 1. Database Schema (MongoDB)

#### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  mobile: String (unique, indexed),
  email: String,
  role: String (enum: ['user', 'admin']),
  createdAt: Date,
  updatedAt: Date
}
```

#### Products Collection
```javascript
{
  _id: ObjectId,
  name: String,
  category: String,
  price: Number,
  description: String,
  images: [String],
  stock: Number,
  featured: Boolean,
  newArrival: Boolean,
  active: Boolean,
  rating: Number,
  reviews: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### Orders Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'Users'),
  items: [{
    productId: ObjectId (ref: 'Products'),
    productName: String,
    quantity: Number,
    price: Number
  }],
  total: Number,
  status: String (enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  shippingAddress: {
    fullName: String,
    mobile: String,
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Banners Collection
```javascript
{
  _id: ObjectId,
  image: String (URL),
  title: String,
  subtitle: String,
  active: Boolean,
  link: String,
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. API Endpoints to Implement

#### Authentication
- `POST /api/auth/send-otp` - Send OTP to mobile
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

#### Products
- `GET /api/products` - Get all products (with filters, search, pagination)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

#### Categories
- `GET /api/categories` - Get all categories

#### Banners
- `GET /api/banners` - Get active banners
- `GET /api/banners/all` - Get all banners (admin only)
- `POST /api/banners` - Create banner (admin only)
- `PUT /api/banners/:id` - Update banner (admin only)
- `DELETE /api/banners/:id` - Delete banner (admin only)

#### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `GET /api/admin/orders` - Get all orders (admin only)
- `PUT /api/admin/orders/:id/status` - Update order status (admin only)

#### Delivery
- `POST /api/delivery/verify-address` - Verify delivery address and return eligibility
- `GET /api/delivery/check-coordinates` - Check coordinates for delivery eligibility

#### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/low-stock` - Get low stock products

### 3. Frontend Integration Steps

#### Step 1: Create API Service Layer
Create `src/services/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// const API_BASE_URL = import.meta.env.VITE_API_URL ||  'https://henway-backend.onrender.com';



const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

#### Step 2: Update Context Providers

Replace mock implementations in:
- `src/context/AuthContext.tsx` - Use actual API calls
- `src/context/CartContext.tsx` - Optionally sync with backend

#### Step 3: Replace Mock Data

Update components to fetch from API:
- Home page: Fetch banners and featured products
- Products page: Fetch products with filters
- Product details: Fetch single product
- Cart/Checkout: Submit orders to API
- Dashboards: Fetch real order and product data

### 4. Environment Variables

Add to `.env`:
```
VITE_API_URL=http://localhost:5000/api
<!-- VITE_API_URL=https://henway-backend.onrender.com -->

```

For production:
```
VITE_API_URL=https://your-api-domain.com/api
```

### 5. Authentication Flow

1. **Send OTP**: User enters mobile number → API sends OTP via SMS
2. **Verify OTP**: User enters OTP → API validates and returns JWT token
3. **Store Token**: Frontend stores JWT in localStorage
4. **API Requests**: Include JWT in Authorization header
5. **Token Refresh**: Implement token refresh mechanism

### 6. File Upload (For Admin)

For product images and banners:
- Use **Multer** for file handling in Express
- Store files in **AWS S3**, **Cloudinary**, or **Firebase Storage**
- Return image URLs to store in MongoDB

### 7. Security Considerations

- Implement rate limiting for OTP requests
- Add CORS configuration for frontend domain
- Validate all inputs on backend
- Use helmet.js for security headers
- Implement CSRF protection
- Hash sensitive data
- Add request logging

### 8. Testing Backend

Use tools like:
- **Postman** for API testing
- **Jest** for unit tests
- **Supertest** for integration tests

### 9. Deployment

#### Backend:
- Deploy to **Render**, **Railway**, or **Heroku**
- Use **MongoDB Atlas** for database
- Set environment variables in hosting platform

#### Frontend:
- Already configured for Firebase Hosting
- Update API URL in production environment

## Sample API Call Examples

### Fetch Products
```typescript
import api from './services/api';

const fetchProducts = async (filters?: any) => {
  const response = await api.get('/products', { params: filters });
  return response.data;
};
```

### Submit Order
```typescript
const createOrder = async (orderData: any) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};
```

### Admin: Update Order Status
```typescript
const updateOrderStatus = async (orderId: string, status: string) => {
  const response = await api.put(`/admin/orders/${orderId}/status`, { status });
  return response.data;
};
```

## Next Steps

1. Set up Node.js/Express server
2. Configure MongoDB connection
3. Implement authentication with Twilio/Firebase for OTP
4. Create API endpoints as per schema
5. Test endpoints with Postman
6. Integrate frontend with backend API
7. Deploy both frontend and backend
8. Test complete flow end-to-end

## Demo Credentials

For current frontend demo:
- **Admin**: Mobile: 9999999999, OTP: any 6 digits
- **User**: Any 10-digit mobile, OTP: any 6 digits

Replace with real authentication once backend is integrated.
