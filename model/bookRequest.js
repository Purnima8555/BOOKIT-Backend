const mongoose = require("mongoose");

const bookRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "customers",
    },
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    isbn: {
      type: String,
      trim: true,
      default: "",
    },
    urgency: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },
    reason: {
      type: String,
      enum: ["not-in-system", "out-of-stock", "new-release", "other"],
      default: "not-in-system",
    },
    additionalInfo: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "fulfilled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const BookRequest = mongoose.model("BookRequest", bookRequestSchema);

module.exports = BookRequest;