const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer", // Reference to the user
    required: true,
  },
  book_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book", // Reference to the book
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1, // Quantity must be at least 1
    default: 1,
  },
  added_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Cart", cartSchema);
