
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkCoordinatesEligibility as apiCheckCoordinates, verifyAddressEligibility, checkPincodeEligibility as apiCheckPincode } from '../../Services/Delivery-api';

interface LocationContextType {
  deliveryArea: string | null;
  isDeliveryEligible: boolean | null;
  locationSource: 'manual' | 'gps' | 'pincode' | null;
  coordinates: { lat: number; lng: number } | null;
  verificationConfidence: 'high' | 'medium' | 'low' | 'manual' | null;
  pincode: string | null;
  displayAddress: string | null;
  setDeliveryArea: (area: string, source: 'manual' | 'gps' | 'pincode', coordinates?: { lat: number; lng: number }, pincode?: string, displayAddress?: string) => void;
  clearDeliveryArea: () => void;
  showLocationPopup: boolean;
  setShowLocationPopup: (show: boolean) => void;
  verifyDeliveryEligibility: (address: any) => Promise<{ eligible: boolean; reason: string; verifiedArea?: string; confidence?: string }>;
  checkCoordinatesEligibility: (lat: number, lng: number) => Promise<{ eligible: boolean; reason: string; verifiedArea?: string; confidence?: string }>;
  checkPincodeEligibility: (pincode: string) => Promise<{ eligible: boolean; reason: string; serviceableAreas?: string[]; serviceablePincodes?: string[] }>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};

const ALLOWED_DELIVERY_AREAS = [
  'Mundhwa', 'Hadapsar', 'Kharadi', 'Kalyani nagar', 'Wagholi', 'Lohegao',
  'Viman nagar', 'Vishrantwadi', 'Manjari', 'Koregaon park', 'Magarpatta',
  'Undri', 'Kondhwa', 'Swarget'
];

const normalizeArea = (area: string): string => {
  return area.toLowerCase().trim().replace(/\s+/g, ' ');
};

const isAreaAllowed = (area: string): boolean => {
  const normalized = normalizeArea(area);
  return ALLOWED_DELIVERY_AREAS.some(allowed => normalizeArea(allowed) === normalized);
};

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [deliveryArea, setDeliveryAreaState] = useState<string | null>(null);
  const [isDeliveryEligible, setIsDeliveryEligible] = useState<boolean | null>(null);
  const [locationSource, setLocationSource] = useState<'manual' | 'gps' | 'pincode' | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [verificationConfidence, setVerificationConfidence] = useState<'high' | 'medium' | 'low' | 'manual' | null>(null);
  const [pincode, setPincode] = useState<string | null>(null);
  const [displayAddress, setDisplayAddress] = useState<string | null>(null);
  const [showLocationPopup, setShowLocationPopup] = useState(false);

  // Load delivery area from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('deliveryArea');
    const storedSource = localStorage.getItem('locationSource');
    const storedCoords = localStorage.getItem('deliveryCoordinates');
    const storedPincode = localStorage.getItem('deliveryPincode');
    const storedDisplayAddress = localStorage.getItem('displayAddress');

    if (stored) {
      const area = stored;
      const source = storedSource as 'manual' | 'gps' | null;
      const coords = storedCoords ? JSON.parse(storedCoords) : null;
      const pincode = storedPincode || null;
      const displayAddress = storedDisplayAddress || null;

      setDeliveryAreaState(area);
      setLocationSource(source);
      setCoordinates(coords);
      setPincode(pincode);
      setDisplayAddress(displayAddress);
      setIsDeliveryEligible(isAreaAllowed(area));
    }

    // Always show popup on website entry
    setShowLocationPopup(true);
  }, []);

  const setDeliveryArea = (area: string, source: 'manual' | 'gps' | 'pincode', coords?: { lat: number; lng: number }, pincode?: string, displayAddress?: string) => {
    const eligible = isAreaAllowed(area);
    setDeliveryAreaState(area);
    setIsDeliveryEligible(eligible);
    setLocationSource(source);
    setCoordinates(coords || null);
    setPincode(pincode || null);
    setDisplayAddress(displayAddress || null);
    setVerificationConfidence(source === 'manual' ? 'manual' : 'high');

    // Store in localStorage
    localStorage.setItem('deliveryArea', area);
    localStorage.setItem('locationSource', source);
    if (coords) {
      localStorage.setItem('deliveryCoordinates', JSON.stringify(coords));
    } else {
      localStorage.removeItem('deliveryCoordinates');
    }
    if (pincode) {
      localStorage.setItem('deliveryPincode', pincode);
    } else {
      localStorage.removeItem('deliveryPincode');
    }
    if (displayAddress) {
      localStorage.setItem('displayAddress', displayAddress);
    } else {
      localStorage.removeItem('displayAddress');
    }

    setShowLocationPopup(false);
  };

  const clearDeliveryArea = () => {
    setDeliveryAreaState(null);
    setIsDeliveryEligible(null);
    setLocationSource(null);
    setCoordinates(null);
    setVerificationConfidence(null);
    setPincode(null);
    setDisplayAddress(null);

    localStorage.removeItem('deliveryArea');
    localStorage.removeItem('locationSource');
    localStorage.removeItem('deliveryCoordinates');
    localStorage.removeItem('deliveryPincode');
    localStorage.removeItem('displayAddress');

    setShowLocationPopup(true);
  };

  // Backend API integration functions
  const verifyDeliveryEligibility = async (address: any) => {
    try {
      const data = await verifyAddressEligibility(address);

      return {
        eligible: data.eligible,
        reason: data.reason,
        verifiedArea: data.verifiedArea,
        confidence: data.confidence,
      };
    } catch (error) {
      console.error('Delivery verification error:', error);
      return {
        eligible: false,
        reason: 'Unable to verify delivery address. Please try again.',
      };
    }
  };

  const checkCoordinatesEligibility = async (lat: number, lng: number) => {
    try {
      const data = await apiCheckCoordinates(lat, lng);

      return {
        eligible: data.eligible,
        reason: data.reason,
        verifiedArea: data.verifiedArea,
        confidence: data.confidence,
      };
    } catch (error) {
      console.error('Coordinates check error:', error);
      return {
        eligible: false,
        reason: 'Unable to verify location. Please try again.',
      };
    }
  };

  const checkPincodeEligibility = async (pincode: string) => {
    try {
      const data = await apiCheckPincode(pincode);

      return {
        eligible: data.eligible,
        reason: data.reason,
        serviceableAreas: data.serviceableAreas,
        serviceablePincodes: data.serviceablePincodes,
      };
    } catch (error) {
      console.error('Pincode check error:', error);
      return {
        eligible: false,
        reason: 'Unable to verify pincode. Please try again.',
      };
    }
  };

  return (
    <LocationContext.Provider
      value={{
        deliveryArea,
        isDeliveryEligible,
        locationSource,
        coordinates,
        verificationConfidence,
        pincode,
        displayAddress,
        setDeliveryArea,
        clearDeliveryArea,
        showLocationPopup,
        setShowLocationPopup,
        verifyDeliveryEligibility,
        checkCoordinatesEligibility,
        checkPincodeEligibility,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
