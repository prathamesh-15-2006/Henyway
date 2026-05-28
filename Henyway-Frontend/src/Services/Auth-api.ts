import { apiConfig } from './api-config';

const BASE_URL = apiConfig.getBaseUrl();



interface SignupData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface VerifyOtpData {
  email: string;
  otp: string;
}

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  password: string;
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

export const signup = async (data: SignupData) => {
  const response = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    body: JSON.stringify(data),
  });

  // Safely parse JSON
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(result.message || 'Signup failed', response, result);
  }
  return result;
};

/**
 * Verifies the OTP for registration.
 * @param email - The user's email address.
 * @param otp - The OTP sent to the user.
 */
export const verifyOtp = async (data: VerifyOtpData) => {
  const response = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    body: JSON.stringify(data),
  });

  // Safely parse JSON
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(result.message || 'OTP verification failed', response, result);
  }
  return result;
};

/**
 * Resends the OTP to the user's email.
 * @param email - The user's email address.
 */
export const resendOtp = async (email: string) => {
  const response = await fetch(`${BASE_URL}/api/auth/resend-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    body: JSON.stringify({ email }),
  });

  // Safely parse JSON
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(result.message || 'Resend OTP failed', response, result);
  }
  return result;
};

export const login = async (data: LoginData) => {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    body: JSON.stringify(data),
  });

  // Safely parse JSON
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(result.message || 'Login failed', response, result);
  }
  return result;
};

export const forgotPassword = async (data: ForgotPasswordData) => {
  const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    body: JSON.stringify(data),
  });

  // Safely parse JSON
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(result.message || 'Forgot password failed', response, result);
  }
  return result;
};

export const resetPassword = async (token: string, data: ResetPasswordData) => {
  const response = await fetch(`${BASE_URL}/api/auth/reset-password/${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    body: JSON.stringify(data),
  });

  // Safely parse JSON
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(result.message || 'Reset password failed', response, result);
  }
  return result;
};

export const getProfile = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  console.log('Using token:', token.substring(0, 20) + '...'); // Debug log

  const response = await fetch(`${BASE_URL}/api/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    mode: 'cors',
  });

  // Safely parse JSON
  if (!response.ok) {
    const text = await response.text();
    const result = text ? JSON.parse(text) : {};
    console.error('Profile fetch failed:', result); // Debug log
    throw new ApiError(result.message || 'Failed to fetch profile data.', response, result);
  }

  // Handle cases where the response might be successful but have no body
  return response.status === 204 ? {} : response.json();
};

export const updateProfile = async (data: { phone?: string; address?: any }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  const response = await fetch(`${BASE_URL}/api/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    mode: 'cors',
    body: JSON.stringify(data),
  });

  // Safely parse JSON
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(result.message || 'Update profile failed', response, result);
  }
  return result;
};

export const logout = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  const response = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    mode: 'cors',
  });

  // Safely parse JSON
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(result.message || 'Logout failed', response, result);
  }
  return result;
};
