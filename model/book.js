const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    series: {
      type: String,
      default: function () {
        return this.title;
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
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    availability_status: {
      type: Boolean,
      default: true,
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
  },
  { timestamps: true }
);

// Middleware to update availability_status based on available_stock
bookSchema.pre("save", function (next) {
  if (this.available_stock === 0) {
    this.availability_status = false;
  } else {
    this.availability_status = true;
  }
  next();
});

// Middleware to handle updates
bookSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  // If available_stock is being updated, check its value
  if (update.available_stock !== undefined) {
    if (update.available_stock === 0) {
      this.set({ availability_status: false });
    } else {
      this.set({ availability_status: true });
    }
  }
  next();
});

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
