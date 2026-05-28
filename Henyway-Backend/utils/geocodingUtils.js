import fetch from 'node-fetch';

/**
 * Reverse geocode coordinates to get area name using Nominatim API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} - { area: string, fullAddress: string, error?: string }
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    // Nominatim API endpoint for reverse geocoding
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    // Add User-Agent header as required by Nominatim
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Henway-Ecommerce/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.address) {
      return {
        area: null,
        fullAddress: null,
        error: 'Unable to determine location from coordinates'
      };
    }

    // Extract area name from different possible fields
    const address = data.address;
    let area = null;
    let city = null;
    let state = null;

    // Priority order for area extraction
    const areaFields = [
      'suburb',           // Most specific
      'neighbourhood',
      'residential',
      'locality',
      'town',
      'city_district',
      'county',
      'state_district',
      'city'              // Least specific
    ];

    for (const field of areaFields) {
      if (address[field]) {
        area = address[field];
        break;
      }
    }

    // Extract city
    city = address.city || address.town || address.state_district || null;

    // Extract state
    state = address.state || null;

    // Fallback to display_name if no specific area found
    if (!area && data.display_name) {
      // Extract first meaningful part of display name
      const parts = data.display_name.split(',');
      area = parts[0]?.trim();
    }

    return {
      area: area || null,
      city: city,
      state: state,
      fullAddress: data.display_name || null,
      rawData: data // Keep raw data for debugging
    };

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      area: null,
      fullAddress: null,
      error: error.message || 'Geocoding service unavailable'
    };
  }
};

/**
 * Forward geocode an address to get coordinates (for validation)
 * @param {string} address - Full address string
 * @returns {Promise<Object>} - { lat: number, lng: number, error?: string }
 */
export const forwardGeocode = async (address) => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Henway-Ecommerce/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return {
        lat: null,
        lng: null,
        error: 'Address not found'
      };
    }

    const result = data[0];

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name
    };

  } catch (error) {
    console.error('Forward geocoding error:', error);
    return {
      lat: null,
      lng: null,
      error: error.message || 'Geocoding service unavailable'
    };
  }
};

/**
 * Extract area name from GPS coordinates with fallback handling
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} - { area: string, confidence: 'high'|'medium'|'low', error?: string }
 */
export const extractAreaFromGPS = async (lat, lng) => {
  const result = await reverseGeocode(lat, lng);

  if (result.error) {
    return {
      area: null,
      confidence: 'low',
      error: result.error
    };
  }

  if (!result.area) {
    return {
      area: null,
      confidence: 'low',
      error: 'Could not extract area name from location'
    };
  }

  // Determine confidence based on the specificity of the geocoding result
  let confidence = 'medium';

  // If we got a suburb or neighbourhood, high confidence
  if (result.rawData?.address?.suburb || result.rawData?.address?.neighbourhood) {
    confidence = 'high';
  }
  // If we only got city-level info, lower confidence
  else if (result.rawData?.address?.city && !result.rawData?.address?.suburb) {
    confidence = 'low';
  }

  return {
    area: result.area,
    city: result.city,
    state: result.state,
    confidence,
    fullAddress: result.fullAddress,
    rawData: result.rawData
  };
};
