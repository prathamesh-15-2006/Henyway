import { ALLOWED_DELIVERY_AREAS, SERVICEABLE_PINCODES, isPincodeServiceable } from "../config/deliveryAreas.js";
import { verifyDeliveryEligibilityEnhanced } from "../utils/deliveryUtils.js";

/**
 * Get all serviceable delivery areas
 */
export const getServiceableAreas = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        areas: ALLOWED_DELIVERY_AREAS,
        total: ALLOWED_DELIVERY_AREAS.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching serviceable areas",
      error: error.message
    });
  }
};

/**
 * Verify delivery eligibility for an address
 */
export const verifyDeliveryAddress = async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address is required"
      });
    }

    const eligibilityCheck = await verifyDeliveryEligibilityEnhanced(address);

    res.status(200).json({
      success: true,
      data: {
        eligible: eligibilityCheck.eligible,
        reason: eligibilityCheck.reason,
        verifiedArea: eligibilityCheck.verifiedArea,
        confidence: eligibilityCheck.confidence,
        serviceableAreas: ALLOWED_DELIVERY_AREAS
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error verifying delivery address",
      error: error.message
    });
  }
};

/**
 * Check if coordinates are within serviceable area
 */
export const checkCoordinates = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates"
      });
    }

    // Create address object with GPS coordinates
    const address = {
      source: "GPS",
      latitude: lat,
      longitude: lng
    };

    const eligibilityCheck = await verifyDeliveryEligibilityEnhanced(address);

    res.status(200).json({
      success: true,
      data: {
        coordinates: { latitude: lat, longitude: lng },
        eligible: eligibilityCheck.eligible,
        reason: eligibilityCheck.reason,
        verifiedArea: eligibilityCheck.verifiedArea,
        confidence: eligibilityCheck.confidence,
        serviceableAreas: ALLOWED_DELIVERY_AREAS
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking coordinates",
      error: error.message
    });
  }
};

/**
 * Check if pincode is serviceable for delivery (Manual Address Check)
 */
export const checkPincode = async (req, res) => {
  try {
    const { address, pincode } = req.body;

    // Step 4: Receive Address Data
    if (!address || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Address text and pincode are required'
      });
    }

    // Step 5: Validate Pincode
    const pincodeStr = String(pincode).trim();
    if (!pincodeStr || !/^\d{6}$/.test(pincodeStr)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pincode format. Must be 6 digits and not empty.'
      });
    }

    // Step 6: Match Pincode with Delivery Areas
    const isServiceable = SERVICEABLE_PINCODES.includes(pincodeStr);

    // Step 7: Decide Result
    let deliveryStatus;
    let message;
    let savedAddress = null;

    if (isServiceable) {
      deliveryStatus = true;
      message = 'Delivery available for this pincode';
      // Step 7: Save address (for manual check, include in response for frontend to handle saving)
      savedAddress = address;
    } else {
      deliveryStatus = false;
      message = 'Sorry, we currently do not deliver to this pincode and address.';
    }

    // Step 8: Send Result to Frontend
    res.status(200).json({
      success: true,
      data: {
        address: savedAddress,
        pincode: pincodeStr,
        eligible: deliveryStatus,
        reason: message,
        serviceableAreas: ALLOWED_DELIVERY_AREAS,
        serviceablePincodes: SERVICEABLE_PINCODES
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking pincode",
      error: error.message
    });
  }
};
