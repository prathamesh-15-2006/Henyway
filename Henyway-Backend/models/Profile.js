import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  name: {
    type: String
  },
  phone: {
    type: String
  },
  addressLine: {
    type: String
  },
  city: {
    type: String
  },
  state: {
    type: String
  },
  pincode: {
    type: String
  },
  country: {
    type: String
  },
  source: {
    type: String,
    enum: ["AUTO", "MANUAL", "GPS"],
    default: "MANUAL"
  },
  // GPS coordinates for location verification
  latitude: {
    type: Number,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    min: -180,
    max: 180
  },
  // Backend verification results
  verifiedArea: {
    type: String
  },
  verificationConfidence: {
    type: String,
    enum: ["high", "medium", "low", "manual", "fallback"]
  },
  geocodingData: {
    type: mongoose.Schema.Types.Mixed // Store raw geocoding response for debugging
  }
});

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  address: addressSchema,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
profileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Profile", profileSchema);
