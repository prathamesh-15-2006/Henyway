import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import generateOTP from "../utils/generateOTP.js";
import { sendOTPEmail } from "../utils/sendOTP.js";
import { sendEmail } from "../utils/sendEmail.js";

// -----------------------------
// Helper functions
// -----------------------------
const hashOTP = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

// -----------------------------
// SIGNUP (send OTP)
// -----------------------------
export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password required" });

    const existing = await User.findOne({ email });
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const otpExpires = Date.now() + 5 * 60 * 1000;

    if (existing) {
      if (existing.verified) return res.status(400).json({ message: "Email already registered" });
      existing.password = hashedPassword;
      existing.otpHash = otpHash;
      existing.otpExpires = otpExpires;
      existing.role = role || "user";
      existing.resendCount = 0; // Reset resend count
      await existing.save();
    } else {
      await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || "user",
        otpHash,
        otpExpires,
        verified: false,
      });
    }

    await sendOTPEmail({
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
      html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
    });

    return res.json({ message: "OTP sent to email. Expires in 5 minutes." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Signup error", error: err.message });
  }
};

// -----------------------------
// VERIFY OTP
// -----------------------------
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.verified) return res.status(400).json({ message: "User already verified" });
    if (!user.otpHash || !user.otpExpires) return res.status(400).json({ message: "No OTP found. Request a new one." });

    // Check if user should be deleted (more than 20 minutes since signup)
    if (Date.now() - user.signupTime > 20 * 60 * 1000) {
      await User.findByIdAndDelete(user._id);
      return res.status(400).json({ message: "Signup session expired. Please sign up again." });
    }

    if (user.otpExpires < Date.now()) {
      await User.findByIdAndDelete(user._id);
      return res.status(400).json({ message: "OTP expired. Your registration has been removed. Please sign up again." });
    }

    if (hashOTP(otp) !== user.otpHash) return res.status(400).json({ message: "Invalid OTP" });

    user.verified = true;
    user.otpHash = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.json({ message: "Email verified successfully. You can now login." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "OTP verification error", error: err.message });
  }
};

// -----------------------------
// RESEND OTP
// -----------------------------
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.verified) return res.status(400).json({ message: "User already verified" });

    // Delete user if signup was more than 20 minutes ago
    if (Date.now() - user.signupTime > 20 * 60 * 1000) {
      await User.findByIdAndDelete(user._id);
      return res.status(400).json({ message: "Signup session expired. Please sign up again." });
    }

    // Check OTP resend limit
    if (user.resendCount >= 5) {
      return res.status(400).json({ message: "You have reached the maximum number of OTP resend attempts." });
    }

    const otp = generateOTP();
    user.otpHash = hashOTP(otp);
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.resendCount += 1;
    await user.save();

    await sendOTPEmail({
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
      html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
    });

    return res.json({ message: "OTP resent to email." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Resend OTP error", error: err.message });
  }
};

// -----------------------------
// LOGIN
// -----------------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.verified) return res.status(400).json({ message: "Please verify your email first" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Create or update profile in database
    await Profile.findOneAndUpdate(
      { userId: user._id },
      { username: user.name, email: user.email },
      { upsert: true, new: true }
    );

    return res.json({
      message: "Login successful",
      token,
      role: user.role,
      name: user.name,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Login error", error: err.message });
  }
};

// -----------------------------
// FORGOT PASSWORD
// -----------------------------
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const FRONTEND_URL = process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : process.env.FRONTEND_URL_LOCAL;
    const resetURL = `${FRONTEND_URL}/reset-password/${resetToken}`;

    const html = `
      <h3>Password Reset Request</h3>
      <p>Click the link below to reset your password:</p>
      <a href="${resetURL}">${resetURL}</a>
      <p>This link expires in 15 minutes.</p>
    `;

    await sendEmail({
      to: email,
      subject: "Reset Your Password",
      html,
    });

    return res.json({ message: "Password reset link sent to your email." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Forgot password error", error: err.message });
  }
};

// -----------------------------
// RESET PASSWORD
// -----------------------------
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "Invalid token" });

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    return res.json({ message: "Password reset successful!" });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Invalid or expired token", error: err.message });
  }
};

// -----------------------------
// LOGOUT
// -----------------------------
export const logout = async (req, res) => {
  try {
    // For JWT-based authentication, logout is typically handled on the client side
    // by removing the token from localStorage. On the server side, we can optionally
    // implement token blacklisting or just return a success response.

    // If you want to implement token blacklisting, you would store the token
    // in a blacklist collection and check it in the auth middleware.

    return res.json({ message: "Logout successful" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Logout error", error: err.message });
  }
};
