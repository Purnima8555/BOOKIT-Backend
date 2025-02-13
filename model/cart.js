const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  book_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  type: {
    type: String,
    enum: ["purchase", "rental"],
    required: true,
    default: "purchase",
  },
  rentalDays: {
    type: Number,
    min: 1,
    required: false, // No longer required by default
    // No default value; only set for "rental"
  },
  added_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Cart", cartSchema);