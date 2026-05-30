import api from './api';

type ProductData = Record<string, any>;

export const createProduct = async (productData: ProductData): Promise<any> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  try {
    const response = await api.post('/api/products', productData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Create product failed';
    throw new Error(message);
  }
};

export const getAllProducts = async (): Promise<any> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  try {
    const response = await api.get('/api/products');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Get products failed';
    throw new Error(message);
  }
};

export const getAllProductsPublic = async (): Promise<any> => {
  try {
    const response = await api.get('/api/products', {
      params: { isPublic: true }
    });
    if (response.status === 304) {
      return { data: [] };
    }
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 304) {
      return { data: [] };
    }
    const message = error.response?.data?.message || 'Get products failed';
    throw new Error(message);
  }
};

export const getProductById = async (productId: string): Promise<any> => {
  try {
    const response = await api.get(`/api/products/${productId}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Get product failed';
    throw new Error(message);
  }
};

export const deleteProduct = async (productId: string): Promise<any> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  try {
    const response = await api.delete(`/api/products/${productId}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Delete product failed';
    throw new Error(message);
  }
};

export const updateProduct = async (productId: string, data: ProductData): Promise<any> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  try {
    const response = await api.put(`/api/products/${productId}`, data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Update product failed';
    throw new Error(message);
  }
};
