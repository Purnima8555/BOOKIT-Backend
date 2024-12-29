const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "customers",
    required: true,
  },
  orderType: {
    type: String,
    enum: ["Purchase", "Rent"],
    required: true,
  },
  items: [
    {
      book_id: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
      quantity: { type: Number, required: true, min: 1 },
      rentDuration: { type: Number, default: 0 },
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
