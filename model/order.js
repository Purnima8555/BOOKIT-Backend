const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "customers",
    required: true,
  },
  items: [
    {
      book_id: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
      quantity: { type: Number, required: true, min: 1 },
      type: {
        type: String,
        enum: ["purchase", "rental"],
        required: true,
      },
      rentalDays: { type: Number, default: 0 },
    },
  ],
  deliveryFee: {
    type: Number,
    required: true,
    default: 0,
  },
  total_price: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["cod", "online", "esewa"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["done", "not done"],
    default: "not done",
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