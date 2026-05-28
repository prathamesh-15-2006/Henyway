import { apiConfig } from './api-config';

const BASE_URL = apiConfig.getBaseUrl();


interface CoordinatesEligibilityResponse {
  success: boolean;
  data: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    eligible: boolean;
    reason: string;
    verifiedArea: string;
    confidence: string;
    serviceableAreas: string[];
  };
}

interface AddressEligibilityResponse {
  success: boolean;
  data: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    eligible: boolean;
    reason: string;
    verifiedArea: string;
    confidence: string;
    serviceableAreas: string[];
  };
}

interface PincodeEligibilityResponse {
  success: boolean;
  data: {
    pincode: string;
    eligible: boolean;
    reason: string;
    serviceableAreas: string[];
    serviceablePincodes: string[];
  };
}

interface ServiceableAreasResponse {
  success: boolean;
  data: {
    serviceableAreas: string[];
    serviceablePincodes: string[];
  };
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

/**
 * Checks delivery eligibility based on coordinates
 * @param latitude - The latitude of the location
 * @param longitude - The longitude of the location
 */
export const checkCoordinatesEligibility = async (latitude: number, longitude: number): Promise<CoordinatesEligibilityResponse['data']> => {
  const response = await fetch(`${BASE_URL}/api/delivery/check-coordinates?latitude=${latitude}&longitude=${longitude}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
  });

  // Safely parse JSON
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(result.message || 'Failed to check coordinates eligibility', response, result);
  }

  return result.data;
};

/**
 * Checks delivery eligibility based on pincode
 * @param pincode - The pincode to verify
 */
export const checkPincodeEligibility = async (pincode: string): Promise<PincodeEligibilityResponse['data']> => {
  const response = await fetch(`${BASE_URL}/api/delivery/check-pincode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    body: JSON.stringify({ pincode }),
  });

  // Safely parse JSON
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(result.message || 'Failed to check pincode eligibility', response, result);
  }

  return result.data;
};

/**
 * Gets all serviceable areas and pincodes
 */
export const getServiceableAreas = async (): Promise<ServiceableAreasResponse['data']> => {
  const response = await fetch(`${BASE_URL}/api/delivery/areas`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
  });

  // Safely parse JSON
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(result.message || 'Failed to get serviceable areas', response, result);
  }

  return result.data;
};

/**
 * Verifies delivery eligibility based on address
 * @param address - The address to verify
 */
export const verifyAddressEligibility = async (address: string): Promise<AddressEligibilityResponse['data']> => {
  const response = await fetch(`${BASE_URL}/api/delivery/verify-address`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    body: JSON.stringify({ address }),
  });

  // Safely parse JSON
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(result.message || 'Failed to verify address eligibility', response, result);
  }

  return result.data;
};
