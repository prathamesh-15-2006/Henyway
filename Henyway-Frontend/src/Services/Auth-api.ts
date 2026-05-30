import api from './api';

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

export const signup = async (data: SignupData): Promise<any> => {
  try {
    const response = await api.post('/api/auth/signup', data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Signup failed';
    throw new Error(message);
  }
};

/**
 * Verifies the OTP for registration.
 * @param data - The OTP verification data including email and otp.
 */
export const verifyOtp = async (data: VerifyOtpData): Promise<any> => {
  try {
    const response = await api.post('/api/auth/verify-otp', data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'OTP verification failed';
    throw new Error(message);
  }
};

/**
 * Resends the OTP to the user's email.
 * @param email - The user's email address.
 */
export const resendOtp = async (email: string): Promise<any> => {
  try {
    const response = await api.post('/api/auth/resend-otp', { email });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Resend OTP failed';
    throw new Error(message);
  }
};

export const login = async (data: LoginData): Promise<any> => {
  try {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Login failed';
    throw new Error(message);
  }
};

export const forgotPassword = async (data: ForgotPasswordData): Promise<any> => {
  try {
    const response = await api.post('/api/auth/forgot-password', data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Forgot password failed';
    throw new Error(message);
  }
};

export const resetPassword = async (token: string, data: ResetPasswordData): Promise<any> => {
  try {
    const response = await api.post(`/api/auth/reset-password/${token}`, data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Reset password failed';
    throw new Error(message);
  }
};

export const getProfile = async (): Promise<any> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  try {
    const response = await api.get('/api/profile');
    return response.data || {};
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to fetch profile data.';
    throw new Error(message);
  }
};

export const updateProfile = async (data: { phone?: string; address?: any }): Promise<any> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  try {
    const response = await api.put('/api/profile', data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Update profile failed';
    throw new Error(message);
  }
};

export const logout = async (): Promise<any> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  try {
    const response = await api.post('/api/auth/logout');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Logout failed';
    throw new Error(message);
  }
};
