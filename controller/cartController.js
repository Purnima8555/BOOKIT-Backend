const Cart = require("../model/cart");

// Add a book to the cart
const addToCart = async (req, res) => {
  try {
    const { user_id, book_id, quantity } = req.body;

    // Check if the book is already in the cart
    const existingCartItem = await Cart.findOne({ user_id, book_id });

    if (existingCartItem) {
      // If the book is already in the cart, update the quantity
      existingCartItem.quantity += quantity || 1;
      await existingCartItem.save();

      return res.status(200).json({ message: "Cart updated successfully", cart: existingCartItem });
    }

    // Add a new cart item
    const newCartItem = new Cart({
      user_id,
      book_id,
      quantity: quantity || 1,
    });

    await newCartItem.save();

    res.status(201).json({ message: "Book added to cart", cart: newCartItem });
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ message: "Error adding to cart", error: err });
  }
};

// Get all cart items for a user
const getCartByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const cartItems = await Cart.find({ user_id })
      .populate("book_id", "title price") // Populate book details (e.g., title, price)
      .sort({ added_at: -1 });

    if (!cartItems || cartItems.length === 0) {
      return res.status(404).json({ message: "No items in cart" });
    }

    res.status(200).json(cartItems);
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ message: "Error fetching cart", error: err });
  }
};

// Update the quantity of a cart item
const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    // Find the cart item and update the quantity
    const cartItem = await Cart.findById(id);

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    if (quantity === 0) {
      // If quantity is 0, remove the item from the cart
      await cartItem.delete();
      return res.status(200).json({ message: "Cart item removed" });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.status(200).json({ message: "Cart updated successfully", cart: cartItem });
  } catch (err) {
    console.error("Error updating cart item:", err);
    res.status(500).json({ message: "Error updating cart item", error: err });
  }
};

// Remove a specific book from the cart
const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCartItem = await Cart.findByIdAndDelete(id);

    if (!deletedCartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.status(200).json({ message: "Cart item removed" });
  } catch (err) {
    console.error("Error removing cart item:", err);
    res.status(500).json({ message: "Error removing cart item", error: err });
  }
};

// Clear all items from the cart for a user
const clearCart = async (req, res) => {
  try {
    const { user_id } = req.params;

    await Cart.deleteMany({ user_id });

    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (err) {
    console.error("Error clearing cart:", err);
    res.status(500).json({ message: "Error clearing cart", error: err });
  }
};

module.exports = {
  addToCart,
  getCartByUser,
  updateCartItem,
  removeFromCart,
  clearCart,
};
