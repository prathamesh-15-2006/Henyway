import Profile from "../models/Profile.js";
import jwt from "jsonwebtoken";

// -----------------------------
// GET PROFILE
// -----------------------------
export const getProfile = async (req, res) => {
    try {
        // Extract token from header
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtErr) {
            return res.status(401).json({ message: "Invalid token", error: jwtErr.message });
        }

        // Find profile by user ID
        const profile = await Profile.findOne({ userId: decoded.id });

        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        // Return profile data
        return res.json({
            username: profile.username,
            email: profile.email,
            phone: profile.phone,
            address: profile.address,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Get profile error", error: err.message });
    }
};

// -----------------------------
// UPDATE PROFILE
// -----------------------------
export const updateProfile = async (req, res) => {
    try {
        // Extract token from header
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtErr) {
            return res.status(401).json({ message: "Invalid token", error: jwtErr.message });
        }

        // Find profile by user ID
        const profile = await Profile.findOne({ userId: decoded.id });

        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        // Update allowed fields
        const { username, phone, address } = req.body;

        if (username !== undefined && username.trim()) {
            profile.username = username.trim();
        }

        if (phone !== undefined) {
            profile.phone = phone;
        }

        if (address !== undefined) {
            profile.address = address;
        }

        await profile.save();

        // Return updated profile data
        return res.json({
            success: true,
            message: "Profile updated successfully",
            data: {
                username: profile.username,
                email: profile.email,
                phone: profile.phone,
                address: profile.address,
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Update profile error", error: err.message });
    }
};
