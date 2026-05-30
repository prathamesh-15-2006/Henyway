import api from './api';

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

/**
 * Checks delivery eligibility based on coordinates
 * @param latitude - The latitude of the location
 * @param longitude - The longitude of the location
 */
export const checkCoordinatesEligibility = async (latitude: number, longitude: number): Promise<CoordinatesEligibilityResponse['data']> => {
  try {
    const response = await api.get(`/api/delivery/check-coordinates`, {
      params: { latitude, longitude }
    });
    const resData = response.data as any;
    return resData.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to check coordinates eligibility';
    throw new Error(message);
  }
};

/**
 * Checks delivery eligibility based on pincode and address
 * @param pincode - The pincode to verify
 * @param address - The full address text to verify
 */
export const checkPincodeEligibility = async (pincode: string, address?: string): Promise<PincodeEligibilityResponse['data']> => {
  try {
    const finalAddress = address || pincode;
    const response = await api.post(`/api/delivery/check-pincode`, { pincode, address: finalAddress });
    const resData = response.data as any;
    return resData.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to check pincode eligibility';
    throw new Error(message);
  }
};

/**
 * Gets all serviceable areas and pincodes
 */
export const getServiceableAreas = async (): Promise<ServiceableAreasResponse['data']> => {
  try {
    const response = await api.get(`/api/delivery/areas`);
    const resData = response.data as any;
    return resData.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to get serviceable areas';
    throw new Error(message);
  }
};

/**
 * Verifies delivery eligibility based on address
 * @param address - The address to verify
 */
export const verifyAddressEligibility = async (address: string): Promise<AddressEligibilityResponse['data']> => {
  try {
    const response = await api.post(`/api/delivery/verify-address`, { address });
    const resData = response.data as any;
    return resData.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to verify address eligibility';
    throw new Error(message);
  }
};
