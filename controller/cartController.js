const Cart = require("../model/cart");
const Book = require("../model/book");


// Add a book to the cart
const addToCart = async (req, res) => {
  try {
    const { user_id, book_id, quantity, type, rentalDays } = req.body;

    // Validate required fields
    if (!user_id || !book_id) {
      return res.status(400).json({ message: "user_id and book_id are required" });
    }

    // Validate type
    if (!["purchase", "rental"].includes(type)) {
      return res.status(400).json({ message: "Invalid type. Must be 'purchase' or 'rental'" });
    }

    // Check if the book exists
    const book = await Book.findById(book_id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // For "rental", ensure rentalDays is provided
    if (type === "rental" && (!rentalDays || rentalDays < 1)) {
      return res.status(400).json({ message: "rentalDays is required for rental type and must be at least 1" });
    }

    // Check if the book is already in the cart
    const existingCartItem = await Cart.findOne({ user_id, book_id });

    if (existingCartItem) {
      // Update existing item
      existingCartItem.quantity += quantity || 1;
      existingCartItem.type = type;
      existingCartItem.rentalDays = type === "rental" ? rentalDays : undefined;
      await existingCartItem.save();

      // Populate the book details before sending the response
      const updatedCartItem = await Cart.findById(existingCartItem._id).populate('book_id');
      return res.status(200).json({
        message: "Cart updated successfully",
        cart: updatedCartItem,
      });
    }

    // Add a new cart item
    const newCartItem = new Cart({
      user_id,
      book_id,
      quantity: quantity || 1,
      type,
      rentalDays: type === "rental" ? rentalDays : undefined,
    });

    await newCartItem.save();

    // Populate the book details before sending the response
    const populatedCartItem = await Cart.findById(newCartItem._id).populate('book_id');

    res.status(201).json({
      message: "Book added to cart",
      cart: populatedCartItem,
    });
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ message: "Error adding to cart", error: err.message });
  }
};


// GetbyUser function
const getCartByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const cartItems = await Cart.find({ user_id })
      .populate({
        path: "book_id",
        select: "title author image price rental_price",
      })
      .sort({ added_at: -1 });

    if (!cartItems || cartItems.length === 0) {
      return res.status(404).json({ message: "No items in cart" });
    }

    const enrichedCartItems = cartItems.map(item => {
      const book = item.book_id;
      const basePrice = item.type === "purchase" ? book.price : book.rental_price * (item.rentalDays / 7);
      return {
        ...item._doc,
        purchasePrice: book.price,
        rentalPrice: book.rental_price,
        basePrice: basePrice,
        totalPrice: basePrice * item.quantity,
      };
    });

    res.status(200).json(enrichedCartItems);
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ message: "Error fetching cart", error: err.message });
  }
};


// Update cart function
const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, type, rentalDays } = req.body;

    const cartItem = await Cart.findById(id).populate("book_id", "price rental_price");
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    if (quantity === 0) {
      await cartItem.deleteOne();
      return res.status(200).json({ message: "Cart item removed" });
    }

    if (quantity !== undefined) cartItem.quantity = quantity;
    if (type) {
      cartItem.type = type;
      cartItem.rentalDays = type === "rental" && rentalDays ? rentalDays : undefined;
    } else if (rentalDays && cartItem.type === "rental") {
      cartItem.rentalDays = rentalDays;
    }

    await cartItem.save();

    const book = cartItem.book_id;
    const basePrice = cartItem.type === "purchase" ? book.price : book.rental_price * (cartItem.rentalDays / 7);
    const updatedItem = {
      ...cartItem._doc,
      purchasePrice: book.price,
      rentalPrice: book.rental_price,
      basePrice: basePrice,
      totalPrice: basePrice * cartItem.quantity,
    };

    res.status(200).json({ message: "Cart updated successfully", cart: updatedItem });
  } catch (err) {
    console.error("Error updating cart item:", err);
    res.status(500).json({ message: "Error updating cart item", error: err.message });
  }
};


// Remove from cart function
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
    res.status(500).json({ message: "Error removing cart item", error: err.message });
  }
};


// Clear function
const clearCart = async (req, res) => {
  try {
    const { user_id } = req.params;

    await Cart.deleteMany({ user_id });

    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (err) {
    console.error("Error clearing cart:", err);
    res.status(500).json({ message: "Error clearing cart", error: err.message });
  }
};

module.exports = {
  addToCart,
  getCartByUser,
  updateCartItem,
  removeFromCart,
  clearCart,
};