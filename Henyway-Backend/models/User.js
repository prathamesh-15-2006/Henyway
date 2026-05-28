import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  otpHash: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  verified: {
    type: Boolean,
    default: false
  },
  signupTime: {
    type: Date,
    default: Date.now
  },
  resendCount: {
    type: Number,
    default: 0
  }
});

// TTL index to automatically delete unverified users after 20 minutes
userSchema.index(
  { signupTime: 1 },
  { expireAfterSeconds: 20 * 60, partialFilterExpression: { verified: false } }
);

export default mongoose.model("User", userSchema);
