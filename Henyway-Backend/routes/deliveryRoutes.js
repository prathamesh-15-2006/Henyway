import express from "express";
import {
  getServiceableAreas,
  verifyDeliveryAddress,
  checkCoordinates,
  checkPincode
} from "../controllers/deliveryController.js";

const router = express.Router();

// Get list of serviceable areas
router.get("/areas", getServiceableAreas);

// Verify if an address is deliverable
router.post("/verify-address", verifyDeliveryAddress);

// Check coordinates for delivery eligibility
router.get("/check-coordinates", checkCoordinates);

// Check pincode for delivery eligibility
router.post("/check-pincode", checkPincode);

export default router;
