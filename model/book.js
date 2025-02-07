const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    series: {
      type: String,
      default: function () {
      return this.title || "";
      },
      set: function (val) {
      return val && val.trim() !== "" ? val : this.title;
      },
    },
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    genre: {
      type: [],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    availability_status: {
      type: String,
    },
    rental_price: {
      type: Number,
      required: true,
    },
    publisher: {
      type: String,
      required: true,
    },
    ISBN: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    available_stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    hasDiscount: {
      type: Boolean,
      default: false,
    },
    discount_type: {
      type: String,
    },
    discount_percent: {
      type: Number,
    },
    discount_start: {
      type: Date,
    },
    discount_end: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Middleware to update availability_status based on available_stock
bookSchema.pre("save", function (next) {
  this.availability_status = this.available_stock > 0 ? 'yes' : 'no'; // Set availability to 'yes' or 'no'
  next();
});

bookSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.available_stock !== undefined) {
    this.set({ availability_status: update.available_stock > 0 ? 'yes' : 'no' });
  }
  next();
});

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
