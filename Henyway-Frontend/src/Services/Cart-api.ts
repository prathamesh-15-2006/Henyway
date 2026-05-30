import api from './api';

export const fetchCart = async (_token?: string): Promise<any> => {
  try {
    const response = await api.get('/api/cart');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Get cart failed';
    throw new Error(message);
  }
};

export const addToCart = async (_token: string, productId: string, quantity: number = 1): Promise<any> => {
  try {
    const response = await api.post('/api/cart/add', {
      productId,
      quantity,
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Add to cart failed';
    throw new Error(message);
  }
};

export const removeFromCart = async (_token: string, productId: string): Promise<any> => {
  try {
    const response = await api.delete(`/api/cart/remove/${productId}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Remove from cart failed';
    throw new Error(message);
  }
};

export const clearCart = async (_token: string): Promise<any> => {
  try {
    const response = await api.delete('/api/cart/clear');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Clear cart failed';
    throw new Error(message);
  }
};
