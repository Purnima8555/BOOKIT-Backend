const Favorite = require("../model/favorite");

// Add a book to favorites
const addFavorite = async (req, res) => {
  try {
    const { user_id, book_id } = req.body;

    // Check if the book is already in favorites
    let favorite = await Favorite.findOne({ user_id, book_id });
    if (favorite) {
      return res.status(400).json({ message: "Book is already in favorites" });
    }

    const newFavorite = new Favorite({ user_id, book_id, isFavorite: true });
    await newFavorite.save();

    res.status(201).json({ message: "Book added to favorites", favorite: newFavorite });
  } catch (err) {
    console.error("Error adding favorite:", err);
    res.status(500).json({ message: "Error adding favorite", error: err });
  }
};

// Get all favorite books for a user
const getFavoritesByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const favorites = await Favorite.find({ user_id })
      .populate("book_id", "title author price image availability_status")
      .sort({ _id: -1 });

    if (!favorites || favorites.length === 0) {
      return res.status(404).json({ message: "No books found in favorites" });
    }

    res.status(200).json(favorites);
  } catch (err) {
    console.error("Error fetching favorites:", err);
    res.status(500).json({ message: "Error fetching favorites", error: err });
  }
};

// Remove a book from favorites
const removeFavorite = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete the favorite record instead of updating it
    const deletedFavorite = await Favorite.findByIdAndDelete(id);

    if (!deletedFavorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.status(200).json({ message: "Book removed from favorites" });
  } catch (err) {
    console.error("Error removing favorite:", err);
    res.status(500).json({ message: "Error removing favorite", error: err });
  }
};

module.exports = {
  addFavorite,
  getFavoritesByUser,
  removeFavorite,
};