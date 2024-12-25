const { required } = require("joi");
const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
},
  image: {
    type: String,
    required: true
},
  author: {
    type: String,
    required: true
},
  genre: {
    type: String,
    required: true
},
  price: {
    type: Number,
    required: true
},
  availability_status: {
    type: Boolean,
    default: true
},
  rental_price: {
    type: Number,
    required: true
},
  publisher: {
    type: String,
    required: true
},
  ISBN: {
    type: String,
    required: true,
    unique: true
},
  description: {
    type: String,
    required: true
},
});

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
