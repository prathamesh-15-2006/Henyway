import { apiConfig } from './api-config';

const BASE_URL = apiConfig.getBaseUrl();




type ProductData = Record<string, any>;

class ApiError extends Error {
  response?: Response;
  data?: any;

  constructor(message: string, response?: Response, data?: any) {
    super(message);
    this.response = response;
    this.data = data;
  }
}

export const createProduct = async (productData: ProductData) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  const response = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    mode: 'cors',
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Create product failed', response, errorJson);
    } catch (e) {
      // If parsing fails, it's not JSON (e.g., HTML error page)
      throw new ApiError(errorText || 'Create product failed', response, errorText);
    }
  }

  return response.json();
};

export const getAllProducts = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  const response = await fetch(`${BASE_URL}/api/products`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    mode: 'cors',
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Get products failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Get products failed', response, errorText);
    }
  }

  return response.json();
};

export const getAllProductsPublic = async (): Promise<any> => {
  // Changed the URL to use a query parameter to avoid clashing with the /products/:id route on the backend.
  // This requires a corresponding backend change to handle this query.
  // The backend should check for `req.query.isPublic` and return all products without authentication.
  const response = await fetch(`${BASE_URL}/api/products?isPublic=true`, {
    method: 'GET',
    mode: 'cors',
  });

  if (response.status === 304) {
    // 304 Not Modified indicates no changes, return empty data to avoid error
    return { data: [] };
  } else if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Get products failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Get products failed', response, errorText);
    }
  }

  return response.json();
};

export const getProductById = async (productId: string) => {
  // This endpoint should be public, so no token is needed.
  const response = await fetch(`${BASE_URL}/api/products/${productId}`, {
    method: 'GET',
    mode: 'cors',
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Get product failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Get product failed', response, errorText);
    }
  }

  return response.json();
};

export const deleteProduct = async (productId: string) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  const response = await fetch(`${BASE_URL}/api/products/${productId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    mode: 'cors',
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Delete product failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Delete product failed', response, errorText);
    }
  }

  return response.json();
};

export const updateProduct = async (productId: string, data: ProductData) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  const response = await fetch(`${BASE_URL}/api/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    mode: 'cors',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Update product failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Update product failed', response, errorText);
    }
  }

  return response.json();
};
