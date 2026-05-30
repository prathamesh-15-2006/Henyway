

import { ALLOWED_DELIVERY_AREAS, normalizeArea, isPincodeServiceable } from "../config/deliveryAreas.js";
import { extractAreaFromGPS } from "./geocodingUtils.js";

/**
 * Helper to get current date/time adjusted to India Standard Time (GMT+5:30)
 * @param {Date} [date] - Optional date object, defaults to now
 * @returns {Object} - { hour, minute, day, month, year, istDate }
 */
export const getISTTime = (date = new Date()) => {
  const istOffset = 5.5 * 60 * 60 * 1000; // India Standard Time (IST) offset is UTC + 5:30
  const istDate = new Date(date.getTime() + istOffset);
  
  return {
    hour: istDate.getUTCHours(),
    minute: istDate.getUTCMinutes(),
    day: istDate.getUTCDate(),
    month: istDate.getUTCMonth(),
    year: istDate.getUTCFullYear(),
    istDate
  };
};

/**
 * Gets the Date object representing midnight IST (00:00:00) of a given date
 * @param {Date} [date] - Optional date object, defaults to now
 * @returns {Date} - Midnight IST Date object in UTC
 */
export const getMidnightIST = (date = new Date()) => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  const midnightUTC = Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate(), 0, 0, 0, 0);
  return new Date(midnightUTC - istOffset);
};

/**
 * Basic delivery verification without GPS support
 * @param {Object} address - The delivery address object
 * @param {string} address.city - The city/area name
 * @returns {Object} - { eligible: boolean, reason: string, verifiedArea: string }
 */
export const verifyDeliveryEligibility = (address) => {
  if (!address || !address.city) {
    return {
      eligible: false,
      reason: "Delivery address is required",
      verifiedArea: null
    };
  }

  const verifiedArea = address.city;
  const normalizedArea = normalizeArea(verifiedArea);

  if (!normalizedArea) {
    return {
      eligible: false,
      reason: "Invalid delivery area specified",
      verifiedArea: null
    };
  }

  const isAllowed = ALLOWED_DELIVERY_AREAS.some(allowed =>
    normalizeArea(allowed) === normalizedArea
  );

  if (!isAllowed) {
    // Log unsupported area for monitoring
    logUnsupportedArea(verifiedArea, {
      latitude: address.latitude,
      longitude: address.longitude
    });

    return {
      eligible: false,
      reason: `Sorry, we currently do not deliver to ${verifiedArea}. We deliver to: ${ALLOWED_DELIVERY_AREAS.join(', ')}`,
      verifiedArea
    };
  }

  return {
    eligible: true,
    reason: "Delivery available",
    verifiedArea
  };
};

/**
 * Enhanced delivery verification with GPS support and confidence scoring
 * @param {Object} address - The delivery address object
 * @param {string} address.city - The city/area name
 * @param {number} address.latitude - GPS latitude (optional)
 * @param {number} address.longitude - GPS longitude (optional)
 * @param {string} address.source - Address source ('AUTO', 'MANUAL', 'GPS')
 * @returns {Promise<Object>} - { eligible: boolean, reason: string, verifiedArea: string, confidence: string, verificationDetails: Object }
 */
export const verifyDeliveryEligibilityEnhanced = async (address) => {
  try {
    let verifiedArea = null;
    let verifiedCity = null;
    let verifiedState = null;
    let confidence = "manual";
    let verificationDetails = {};

    // If GPS coordinates are provided, perform reverse geocoding
    if (address.latitude && address.longitude && address.source === "GPS") {
      const gpsResult = await extractAreaFromGPS(address.latitude, address.longitude);

      if (gpsResult.error) {
        // If geocoding fails, fall back to manual address but with lower confidence
        confidence = "fallback";
        verificationDetails.geocodingError = gpsResult.error;
        if (address.city) {
          verifiedArea = address.city;
          verifiedCity = address.city;
        }
      } else {
        // Use GPS-verified data
        verifiedArea = gpsResult.area;
        verifiedCity = gpsResult.city;
        verifiedState = gpsResult.state;
        confidence = gpsResult.confidence;
        verificationDetails = {
          gpsArea: gpsResult.area,
          gpsCity: gpsResult.city,
          gpsState: gpsResult.state,
          confidence: gpsResult.confidence,
          fullAddress: gpsResult.fullAddress,
          rawGeocodingData: gpsResult.rawData
        };
      }
    } else {
      // Manual address entry
      if (!address || !address.city) {
        return {
          eligible: false,
          reason: "Delivery address is required",
          verifiedArea: null,
          confidence: "manual",
          verificationDetails: {}
        };
      }

      // First, try to extract area from addressLine
      if (address.addressLine) {
        const extractedArea = extractAreaFromAddressLine(address.addressLine);
        if (extractedArea) {
          verifiedArea = extractedArea;
          confidence = "address_line";
        }
      }

      // If no area from addressLine, check pincode
      if (!verifiedArea && address.pincode && isPincodeServiceable(address.pincode)) {
        verifiedArea = "Serviceable Pincode Area";
        confidence = "pincode";
      }

      // Fallback to city if no other area found
      if (!verifiedArea) {
        verifiedArea = address.city;
      }

      verifiedCity = address.city;
      verifiedState = address.state;
    }

    // Check if city is Pune and state is Maharashtra (if available)
    const normalizedCity = normalizeArea(verifiedCity);
    const normalizedState = normalizeArea(verifiedState);

    const isCityPune = normalizedCity && normalizeArea("Pune") === normalizedCity;
    const isStateMaharashtra = normalizedState && normalizeArea("Maharashtra") === normalizedState;

    if (verifiedCity && verifiedState && (!isCityPune || !isStateMaharashtra)) {
      return {
        eligible: false,
        reason: "We currently only deliver within Pune, Maharashtra",
        verifiedArea,
        confidence,
        verificationDetails
      };
    }

    // Normalize the area for comparison
    const normalizedArea = normalizeArea(verifiedArea);

    if (!normalizedArea) {
      return {
        eligible: false,
        reason: "Invalid delivery area specified",
        verifiedArea: null,
        confidence,
        verificationDetails
      };
    }

    // Check if the area is in our allowed list
    const isAllowed = ALLOWED_DELIVERY_AREAS.some(allowed =>
      normalizeArea(allowed) === normalizedArea
    );

    if (!isAllowed) {
      // Log unsupported area for monitoring
      logUnsupportedArea(verifiedArea, {
        latitude: address.latitude,
        longitude: address.longitude
      });

      return {
        eligible: false,
        reason: `Sorry, we currently do not deliver to ${verifiedArea}. We deliver to: ${ALLOWED_DELIVERY_AREAS.join(', ')}`,
        verifiedArea,
        confidence,
        verificationDetails
      };
    }

    return {
      eligible: true,
      reason: "Delivery available",
      verifiedArea,
      confidence,
      verificationDetails
    };

  } catch (error) {
    console.error('Enhanced delivery verification error:', error);
    return {
      eligible: false,
      reason: "Delivery verification failed due to an error",
      verifiedArea: null,
      confidence: "error",
      verificationDetails: { error: error.message }
    };
  }
};

/**
 * Extract delivery area from address line by matching against allowed areas
 * @param {string} addressLine - The full address line
 * @returns {string|null} - The matched area name or null if not found
 */
export const extractAreaFromAddressLine = (addressLine) => {
  if (!addressLine) return null;

  const normalizedAddress = normalizeArea(addressLine);

  // Look for exact matches of allowed areas in the address line
  for (const allowedArea of ALLOWED_DELIVERY_AREAS) {
    const normalizedAllowed = normalizeArea(allowedArea);
    if (normalizedAddress.includes(normalizedAllowed)) {
      return allowedArea;
    }
  }

  return null;
};

/**
 * Logs unsupported delivery areas for monitoring and potential expansion
 * @param {string} area - The unsupported area name
 * @param {Object} coordinates - Optional GPS coordinates {latitude, longitude}
 */
export const logUnsupportedArea = (area, coordinates = {}) => {
  const logEntry = {
    area,
    coordinates,
    timestamp: new Date().toISOString(),
    source: 'delivery_verification'
  };

  // In a real application, this would be sent to a logging service or database
  console.log('Unsupported delivery area requested:', JSON.stringify(logEntry, null, 2));
};

/**
 * Validates if an order can be placed at the current time
 * Orders accepted only between 9:00 AM – 9:00 PM
 * @returns {Object} - { canPlace: boolean, reason: string, nextAvailableTime: Date }
 */
export const validateOrderTime = () => {
  const now = new Date();
  const istTime = getISTTime(now);
  const currentHour = istTime.hour;

  // Business hours: 9 AM to 9 PM IST
  const isWithinBusinessHours = currentHour >= 9 && currentHour < 21;

  if (isWithinBusinessHours) {
    return {
      canPlace: true,
      reason: "Orders can be placed during business hours",
      nextAvailableTime: null
    };
  }

  // Before 9 AM IST (9:00 AM IST in UTC is 3:30 AM UTC today)
  if (currentHour < 9) {
    const nextAvailableTime = new Date(now);
    nextAvailableTime.setUTCHours(3, 30, 0, 0);
    return {
      canPlace: false,
      reason: "Orders will be delivered after 9:00 AM",
      nextAvailableTime
    };
  }

  // After 9 PM IST (9:00 AM IST tomorrow in UTC is 3:30 AM UTC tomorrow)
  const nextAvailableTime = new Date(now);
  nextAvailableTime.setUTCDate(nextAvailableTime.getUTCDate() + 1);
  nextAvailableTime.setUTCHours(3, 30, 0, 0);

  return {
    canPlace: false,
    reason: "Orders are closed for today. Please order tomorrow after 9 AM.",
    nextAvailableTime
  };
};

/**
 * Calculates estimated delivery time based on delivery type
 * @param {string} deliveryType - "ASAP" or "SCHEDULED"
 * @param {Date} scheduledTime - Scheduled delivery time (for SCHEDULED type)
 * @param {Date} orderTime - Order placement time (defaults to now)
 * @returns {Date} - Estimated delivery time
 */
export const calculateEstimatedDeliveryTime = (deliveryType, scheduledTime = null, orderTime = null) => {
  const baseTime = orderTime || new Date();

  if (deliveryType === "SCHEDULED" && scheduledTime) {
    return new Date(scheduledTime);
  }

  // For ASAP: orderTime + 1 hour (can extend up to 2-4 hours due to traffic)
  const estimatedTime = new Date(baseTime);
  estimatedTime.setHours(estimatedTime.getHours() + 1);

  return estimatedTime;
};

/**
 * Validates scheduled delivery time
 * @param {Date} scheduledTime - The requested delivery time
 * @param {Date} orderTime - Order placement time (defaults to now)
 * @returns {Object} - { valid: boolean, reason: string }
 */
export const validateScheduledDeliveryTime = (scheduledTime, orderTime = null) => {
  const now = orderTime || new Date();
  const scheduled = new Date(scheduledTime);

  // Must be today only (same-day delivery)
  const today = getMidnightIST(now);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  if (scheduled < today || scheduled >= tomorrow) {
    return {
      valid: false,
      reason: "Scheduled delivery must be for today only"
    };
  }

  // Must be at least 1 hour from now
  const minTime = new Date(now);
  minTime.setHours(minTime.getHours() + 1);

  if (scheduled < minTime) {
    return {
      valid: false,
      reason: "Scheduled delivery must be at least 1 hour from now"
    };
  }

  // Must be before 9 PM IST (which is 21 hours from midnight IST)
  const maxTime = new Date(today.getTime() + 21 * 60 * 60 * 1000); // Midnight + 21 hours = 9 PM IST

  if (scheduled > maxTime) {
    return {
      valid: false,
      reason: "Scheduled delivery cannot be after 9:00 PM"
    };
  }

  return {
    valid: true,
    reason: "Scheduled time is valid"
  };
};

/**
 * Gets available delivery time slots for today
 * @param {Date} orderTime - Order placement time (defaults to now)
 * @returns {Array} - Array of available time slots
 */
export const getAvailableDeliverySlots = (orderTime = null) => {
  const now = orderTime || new Date();
  const today = getMidnightIST(now);

  const slots = [];
  const minTime = new Date(now);
  minTime.setHours(minTime.getHours() + 1);

  const maxTime = new Date(today.getTime() + 21 * 60 * 60 * 1000); // Midnight + 21 hours = 9 PM IST

  // Generate slots every 30 minutes
  let currentSlot = new Date(minTime);

  while (currentSlot <= maxTime) {
    slots.push({
      time: new Date(currentSlot),
      label: currentSlot.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    });

    currentSlot.setMinutes(currentSlot.getMinutes() + 30);
  }

  return slots;
};

/**
 * Checks if delivery is still valid for an order
 * @param {Date} estimatedTime - Estimated delivery time
 * @returns {Object} - { valid: boolean, reason: string, shouldCancel: boolean }
 */
export const validateDeliveryDeadline = (estimatedTime) => {
  const now = new Date();
  const deadline = new Date(estimatedTime);
  deadline.setHours(deadline.getHours() + 3); // 4 hours total from order time

  if (now > deadline) {
    return {
      valid: false,
      reason: "Delivery deadline exceeded",
      shouldCancel: true
    };
  }

  return {
    valid: true,
    reason: "Delivery within acceptable time",
    shouldCancel: false
  };
};
