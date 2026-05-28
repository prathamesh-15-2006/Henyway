import { apiConfig } from './api-config';

const BASE_URL = apiConfig.getBaseUrl();


type CartData = Record<string, any>;

class ApiError extends Error {
  response?: Response;
  data?: any;

  constructor(message: string, response?: Response, data?: any) {
    super(message);
    this.response = response;
    this.data = data;
  }
}

export const fetchCart = async (token: string) => {
  const response = await fetch(`${BASE_URL}/api/cart`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Get cart failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Get cart failed', response, errorText);
    }
  }

  return response.json();
};

export const addToCart = async (token: string, productId: string, quantity: number = 1) => {
  const response = await fetch(`${BASE_URL}/api/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      productId,
      quantity,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Add to cart failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Add to cart failed', response, errorText);
    }
  }

  return response.json();
};

export const removeFromCart = async (token: string, productId: string) => {
  const response = await fetch(`${BASE_URL}/api/cart/remove/${productId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Remove from cart failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Remove from cart failed', response, errorText);
    }
  }

  return response.json();
};



export const clearCart = async (token: string) => {
  const response = await fetch(`${BASE_URL}/api/cart/clear`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError(errorJson.message || 'Clear cart failed', response, errorJson);
    } catch (e) {
      throw new ApiError(errorText || 'Clear cart failed', response, errorText);
    }
  }

  return response.json();
};
