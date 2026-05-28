import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Add product to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Product ID and valid quantity are required"
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Find or create cart for user
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if product already exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        productId,
        quantity,
        price: product.price
      });
    }

    // Calculate total price
    cart.totalPrice = cart.items.reduce((total, item) => {
      const itemPrice = parseFloat(item.price) || 0;
      return total + (itemPrice * item.quantity);
    }, 0);

    await cart.save();

    // Populate and filter the cart before returning
    await cart.populate('items.productId');
    cart.items = cart.items.filter(item => item.productId !== null);

    // Recalculate total price after filtering
    cart.totalPrice = cart.items.reduce((total, item) => {
      const itemPrice = parseFloat(item.price) || 0;
      return total + (itemPrice * item.quantity);
    }, 0);

    // Save if modified
    if (cart.isModified()) {
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding product to cart",
      error: error.message
    });
  }
};

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) {
      return res.status(200).json({
        success: true,
        data: { items: [], totalPrice: 0 }
      });
    }

    // Filter out items where product no longer exists
    cart.items = cart.items.filter(item => item.productId !== null);

    // Recalculate total price after filtering
    cart.totalPrice = cart.items.reduce((total, item) => {
      const itemPrice = parseFloat(item.price) || 0;
      return total + (itemPrice * item.quantity);
    }, 0);

    // Save the updated cart if items were filtered out
    if (cart.isModified()) {
      await cart.save();
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching cart",
      error: error.message
    });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Product ID and valid quantity are required"
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart"
      });
    }

    cart.items[itemIndex].quantity = quantity;

    // Recalculate total price
    cart.totalPrice = cart.items.reduce((total, item) => {
      const itemPrice = parseFloat(item.price) || 0;
      return total + (itemPrice * item.quantity);
    }, 0);

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating cart item",
      error: error.message
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId
    );

    // Recalculate total price
    cart.totalPrice = cart.items.reduce((total, item) => {
      const itemPrice = parseFloat(item.price) || 0;
      return total + (itemPrice * item.quantity);
    }, 0);

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Product removed from cart successfully",
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error removing product from cart",
      error: error.message
    });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { items: [], totalPrice: 0 },
      { new: true }
    );

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error clearing cart",
      error: error.message
    });
  }
};
