/**
 * Centralized API Configuration
 * Handles both local development and production deployment
 */

// API URLs from environment variables
const PRODUCTION_API_URL = import.meta.env.VITE_API_URL_PRODUCTION;
const LOCAL_API_URL = import.meta.env.VITE_API_URL_LOCAL;

// Determine if running in development mode
const isDevelopment = import.meta.env.DEV;

// Determine which API URL to use
let BASE_URL: string;

if (isDevelopment) {
  // In development, use local backend (port 5000)
  BASE_URL = LOCAL_API_URL || 'http://localhost:5000';
  console.log('🔧 Using LOCAL API:', BASE_URL);
} else {
  // In production, use production backend with fallback to live Render backend
  BASE_URL = PRODUCTION_API_URL || 'https://henway-backend.onrender.com';
  console.log('🚀 Using PRODUCTION API:', BASE_URL);
}

/**
 * API Configuration Object
 */
export const apiConfig = {
  // Primary URLs
  PRODUCTION_API_URL: PRODUCTION_API_URL || 'https://henway-backend.onrender.com',
  LOCAL_API_URL: LOCAL_API_URL || 'http://localhost:5000',

  // Current active URL
  BASE_URL,

  // Utilities
  isDevelopment,

  /**
   * Get the appropriate base URL
   * Fallback to local if production is unreachable
   */
  getBaseUrl(): string {
    return BASE_URL;
  },

  /**
   * Switch to local backend (for manual testing)
   */
  useLocal(): void {
    BASE_URL = this.LOCAL_API_URL;
    console.log('✓ Switched to LOCAL API:', BASE_URL);
  },

  /**
   * Switch to production backend
   */
  useProduction(): void {
    BASE_URL = this.PRODUCTION_API_URL;
    console.log('✓ Switched to PRODUCTION API:', BASE_URL);
  },
};

export default apiConfig;
