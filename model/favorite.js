const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model("Favorite", favoriteSchema);
