const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer", // Reference to the user
    required: true,
  },
  items: [
    {
      book_id: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
      quantity: { type: Number, required: true, min: 1 },
    },
  ],
  total_price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered"],
    default: "Pending",
  },
  order_date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
