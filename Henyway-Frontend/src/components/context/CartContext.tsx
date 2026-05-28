import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '../types';
import { useAuth } from './AuthContext';
import { fetchCart, addToCart as apiAddToCart, removeFromCart as apiRemoveFromCart, clearCart as apiClearCart } from '../../Services/Cart-api';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: number;
  cartCount: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCartData();
    } else {
      // Load cart from localStorage for unauthenticated users
      const storedCart = localStorage.getItem('guestCart');
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      } else {
        setCart([]);
      }
    }
  }, [isAuthenticated]);

  const fetchCartData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const cartData = await fetchCart(token);
      console.log('Fetched cart data:', cartData);
      // Handle different API response formats
      if (Array.isArray(cartData)) {
        setCart(cartData);
      } else if (cartData && cartData.data && cartData.data.items && Array.isArray(cartData.data.items)) {
        // Transform API response to match CartItem interface
        const transformedItems = cartData.data.items.map((item: any) => ({
          product: {
            id: item.productId._id,
            name: item.productId.name,
            price: typeof item.productId.price === 'string'
              ? parseFloat(item.productId.price.replace('₹', '').replace('/kg', ''))
              : parseFloat(item.productId.price),
            description: item.productId.description,
            images: [item.productId.image],
            category: item.productId.category,
            stock: 10, // Default stock, you might want to get this from API
            featured: false,
            newArrival: false,
            active: true,
            rating: 4.5,
            reviews: 10
          },
          quantity: item.quantity
        }));
        setCart(transformedItems);
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product: Product, quantity: number = 1) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Handle guest cart
      setLoading(true);
      const existingCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const existingItemIndex = existingCart.findIndex((item: CartItem) => item.product.id === product.id);

      if (existingItemIndex >= 0) {
        existingCart[existingItemIndex].quantity += quantity;
      } else {
        existingCart.push({ product, quantity });
      }

      localStorage.setItem('guestCart', JSON.stringify(existingCart));
      setCart(existingCart);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      await apiAddToCart(token, product.id, quantity);
      await fetchCartData(); // Refresh cart after adding
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Handle guest cart
      setLoading(true);
      const existingCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const updatedCart = existingCart.filter((item: CartItem) => item.product.id !== productId);
      localStorage.setItem('guestCart', JSON.stringify(updatedCart));
      setCart(updatedCart);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      await apiRemoveFromCart(token, productId);
      await fetchCartData(); // Refresh cart after removing
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      // Handle guest cart
      setLoading(true);
      const existingCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const itemIndex = existingCart.findIndex((item: CartItem) => item.product.id === productId);
      if (itemIndex >= 0) {
        existingCart[itemIndex].quantity = quantity;
        localStorage.setItem('guestCart', JSON.stringify(existingCart));
        setCart(existingCart);
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      await apiRemoveFromCart(token, productId);
      await apiAddToCart(token, productId, quantity);
      await fetchCartData();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Handle guest cart
      setLoading(true);
      localStorage.removeItem('guestCart');
      setCart([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      await apiClearCart(token);
      setCart([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
