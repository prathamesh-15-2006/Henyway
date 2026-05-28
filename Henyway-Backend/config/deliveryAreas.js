// Allowed delivery areas for Henway
export const ALLOWED_DELIVERY_AREAS = [
  "Mundhwa",
  "Hadapsar",
  "Kharadi",
  "Kalyani nagar",
  "Wagholi",
  "Lohegao",
  "Viman nagar",
  "Vishrantwadi",
  "Manjari",
  "Koregaon park",
  "Magarpatta",
  "Undri",
  "Kondhwa",
  "Swarget"
];

// Function to normalize area name for comparison
export const normalizeArea = (area) => {
  if (!area) return "";
  return area.toLowerCase().trim().replace(/\s+/g, ' ');
};

// Function to check if area is allowed
export const isAreaAllowed = (area) => {
  const normalized = normalizeArea(area);
  return ALLOWED_DELIVERY_AREAS.some(allowed => normalizeArea(allowed) === normalized);
};

// Serviceable pincodes for Pune area (excluding Katraj)
export const SERVICEABLE_PINCODES = [
  '411001', '411002', '411003', '411004', '411005', '411006', '411007', '411008',
  '411009', '411010', '411011', '411012', '411013', '411014', '411015', '411016',
  '411017', '411018', '411019', '411020', '411021', '411022', '411023', '411024',
  '411025', '411026', '411027', '411028', '411029', '411030', '411031', '411032',
  '411033', '411034', '411035', '411036', '411037', '411038', '411039', '411040',
  '411041', '411042', '411043', '411044', '411045', '411047', '411048',
  '411049', '411050', '411051', '411052', '411053', '411054', '411055', '411056',
  '411057', '411058', '411059', '411060', '411061', '411062', '411063', '411064',
  '411065', '411066', '411067', '411068', '411069', '411070'
];

// Function to check if pincode is serviceable
export const isPincodeServiceable = (pincode) => {
  const pincodeStr = String(pincode).trim();
  return SERVICEABLE_PINCODES.includes(pincodeStr);
};
