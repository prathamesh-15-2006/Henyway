  
  
  
  
  import { useState } from 'react';
import { MapPin, Navigation, Loader2, X, Hash } from 'lucide-react';
import { useLocation } from './context/LocationContext';
import { motion, AnimatePresence } from 'framer-motion';

const ALLOWED_DELIVERY_AREAS = [
  'Mundhwa', 'Hadapsar', 'Kharadi', 'Kalyani nagar', 'Wagholi', 'Lohegao',
  'Viman nagar', 'Vishrantwadi', 'Manjari', 'Koregaon park', 'Magarpatta',
  'Undri', 'Kondhwa', 'Swarget'
];

export const LocationPopup = () => {
  const { showLocationPopup, setShowLocationPopup, setDeliveryArea, checkCoordinatesEligibility, checkPincodeEligibility } = useLocation();
  const [selectedOption, setSelectedOption] = useState<'manual' | 'gps' | 'pincode' | null>(null);
  const [manualArea, setManualArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [manualError, setManualError] = useState('');
  const [detectedArea, setDetectedArea] = useState('');
  const [pincodeResult, setPincodeResult] = useState<{ eligible: boolean; reason: string; serviceableAreas?: string[]; serviceablePincodes?: string[] } | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError('');
    setCoordinates(null);
    setDetectedArea('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });

        // Use backend API to verify delivery eligibility
        try {
          const eligibilityCheck = await checkCoordinatesEligibility(latitude, longitude);

          if (eligibilityCheck.eligible) {
            setDetectedArea(eligibilityCheck.verifiedArea || 'Serviceable Area');
          } else {
            setLocationError('You are not in our delivery area. Please select a location from our serviceable areas or enter manually.');
          }
        } catch (error) {
          console.error('Delivery eligibility check error:', error);
          setLocationError('Failed to verify delivery area. Please enter address manually.');
        }

        setLocationLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to get your location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access in your browser settings and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please check your GPS settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again or enter address manually.';
            break;
        }

        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // Reduced timeout to 10 seconds for faster fallback
        maximumAge: 300000
      }
    );
  };

  const handleManualSubmit = async () => {
    const input = manualArea.trim();
    if (!input) return;

    setManualError('');

    const serviceablePincodes = [
      "411001", "411002", "411003", "411004", "411005", "411006", "411007", "411008", "411009", "411010",
      "411011", "411012", "411013", "411014", "411015", "411016", "411017", "411018", "411019", "411020",
      "411021", "411022", "411023", "411024", "411025", "411026", "411027", "411028", "411029", "411030",
      "411031", "411032", "411033", "411034", "411035", "411036", "411037", "411038", "411039", "411040",
      "411041", "411042", "411043", "411044", "411045", "411047", "411048", "411049", "411050", "411051",
      "411052", "411053", "411054", "411055", "411056", "411057", "411058", "411059", "411060", "411061",
      "411062", "411063", "411064", "411065", "411066", "411067", "411068", "411069", "411070"
    ];

    const serviceableAreas = [
      "Mundhwa", "Hadapsar", "Kharadi", "Kalyani nagar", "Wagholi", "Lohegao",
      "Viman nagar", "Vishrantwadi", "Manjari", "Koregaon park", "Magarpatta",
      "Undri", "Kondhwa", "Swarget"
    ];

    // Split input by spaces, commas, etc.
    const words = input.split(/[\s,]+/).filter(word => word.length > 0);

    let foundPincode = null;
    let foundArea = null;

    for (const word of words) {
      // Check for pincode
      if (/^\d{6}$/.test(word) && serviceablePincodes.includes(word)) {
        foundPincode = word;
        break; // Prioritize first valid pincode
      }
      // Check for area
      const normalizedWord = word.toLowerCase();
      if (serviceableAreas.some(area => area.toLowerCase() === normalizedWord)) {
        foundArea = word;
      }
    }

    if (foundPincode) {
      setDeliveryArea(foundPincode, 'manual');
    } else if (foundArea) {
      setDeliveryArea(foundArea, 'manual');
    } else {
      setManualError('No valid area or pincode found in your address. Please enter a valid area name or pincode.');
    }
  };

  const handleGpsSubmit = () => {
    if (detectedArea) {
      setDeliveryArea(detectedArea, 'gps', coordinates || undefined);
    }
  };

  const handleSkip = () => {
    setShowLocationPopup(false);
  };

  const handlePincodeCheck = async () => {
    if (!pincode.trim()) return;

    setPincodeLoading(true);
    setPincodeError('');
    setPincodeResult(null);

    try {
      const result = await checkPincodeEligibility(pincode);
      setPincodeResult(result);
    } catch (error) {
      console.error('Pincode check error:', error);
      setPincodeError('Failed to check pincode. Please try again.');
    } finally {
      setPincodeLoading(false);
    }
  };

  if (!showLocationPopup) return null;

  const handlePincodeSubmit = () => {
    if (pincodeResult?.eligible) {
      setDeliveryArea(pincode, 'pincode');
      setShowLocationPopup(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 rounded-full p-2">
                  <MapPin className="w-6 h-6 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Select Your Delivery Location</h2>
              </div>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Serviceable Areas Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-green-800 mb-2">
                🚚 We Deliver To These Areas
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                {ALLOWED_DELIVERY_AREAS.map((area) => (
                  <span key={area} className="bg-green-100 px-2 py-1 rounded-md text-center">
                    {area}
                  </span>
                ))}
              </div>
            </div>

            {/* Options */}
            {!selectedOption && (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedOption('gps')}
                  className="flex items-center gap-3 w-full p-4 border-2 border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <Navigation className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Use Current Location</div>
                    <div className="text-sm text-gray-600">Auto-detect your area using GPS</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedOption('pincode')}
                  className="flex items-center gap-3 w-full p-4 border-2 border-purple-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <Hash className="w-5 h-5 text-purple-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Enter Pincode</div>
                    <div className="text-sm text-gray-600">Check delivery availability by pincode</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedOption('manual')}
                  className="flex items-center gap-3 w-full p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Enter Location Manually</div>
                    <div className="text-sm text-gray-600">Select from our serviceable areas</div>
                  </div>
                </button>
              </div>
            )}

            {/* GPS Option */}
            {selectedOption === 'gps' && (
              <div className="space-y-4">
                <button
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {locationLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Navigation className="w-5 h-5" />
                  )}
                  <span>{locationLoading ? 'Detecting location...' : 'Detect My Location'}</span>
                </button>

                {locationError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{locationError}</p>
                  </div>
                )}

                {detectedArea && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">
                        Detected Location: {detectedArea}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleGpsSubmit}
                        className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors"
                      >
                        Use This Location
                      </button>
                      <button
                        onClick={() => setSelectedOption('manual')}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                      >
                        Enter Manually
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSelectedOption(null)}
                  className="w-full text-gray-600 text-sm hover:text-gray-800 transition-colors"
                >
                  ← Back to options
                </button>
              </div>
            )}

            {/* Pincode Option */}
            {selectedOption === 'pincode' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Your Pincode
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 411001"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handlePincodeCheck}
                  disabled={!pincode.trim() || pincodeLoading}
                  className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pincodeLoading ? 'Checking...' : 'Check Availability'}
                </button>

                {pincodeError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{pincodeError}</p>
                  </div>
                )}

                {pincodeResult && (
                  <div className={`border rounded-lg p-4 ${pincodeResult.eligible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className={`w-4 h-4 ${pincodeResult.eligible ? 'text-green-600' : 'text-red-600'}`} />
                      <span className={`text-sm font-medium ${pincodeResult.eligible ? 'text-green-900' : 'text-red-900'}`}>
                        {pincodeResult.eligible ? '✓ Delivery Available' : '✗ Delivery Not Available'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{pincodeResult.reason}</p>

                    {pincodeResult.eligible && (
                      <button
                        onClick={handlePincodeSubmit}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                      >
                        Use This Pincode
                      </button>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setSelectedOption(null)}
                  className="w-full text-gray-600 text-sm hover:text-gray-800 transition-colors"
                >
                  ← Back to options
                </button>
              </div>
            )}

            {/* Manual Option */}
            {selectedOption === 'manual' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Your Address or Pincode
                  </label>
                  <input
                    type="text"
                    value={manualArea}
                    onChange={(e) => setManualArea(e.target.value)}
                    placeholder="e.g. Mundhwa or 411001"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                {manualError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{manualError}</p>
                  </div>
                )}

                <button
                  onClick={handleManualSubmit}
                  disabled={!manualArea.trim()}
                  className="w-full bg-amber-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Location
                </button>

                <button
                  onClick={() => setSelectedOption(null)}
                  className="w-full text-gray-600 text-sm hover:text-gray-800 transition-colors"
                >
                  ← Back to options
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <button
              onClick={handleSkip}
              className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              Skip for now (you can set it later)
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
