import express from "express";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from "../controllers/cartController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// All cart routes require authentication
router.use(authMiddleware);

// Add product to cart
router.post("/add", addToCart);

// Get user's cart
router.get("/", getCart);

// Update cart item quantity
router.put("/update", updateCartItem);

// Remove item from cart
router.delete("/remove/:productId", removeFromCart);

// Clear entire cart
router.delete("/clear", clearCart);

export default router;
