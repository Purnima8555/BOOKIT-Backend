const Customer = require("../model/customer");
const Feedback = require("../model/feedback");
const mongoose = require("mongoose");

// Add Feedback for a Book
const addFeedback = async (req, res) => {
  try {
    const { user_id, book_id, rating, comment } = req.body;

    // Validate rating is within allowed range
    if (rating < 0 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 0 and 5" });
    }

    const newFeedback = new Feedback({
      user_id,
      book_id,
      rating,
      comment,
    });

    await newFeedback.save();

    res.status(201).json({
      message: "Feedback added successfully",
      feedback: newFeedback,
    });
  } catch (err) {
    console.error("Error adding feedback:", err);
    res.status(500).json({ message: "Error adding feedback", error: err });
  }
};

// Get All Feedback
const getAllFeedback = async (req, res) => {
  try {
    const feedbackList = await Feedback.find()
      .populate("user_id", "username")
      .populate("book_id", "title")
      .sort({ date: -1 });

    res.status(200).json(feedbackList);
  } catch (err) {
    console.error("Error fetching all feedback:", err);
    res.status(500).json({ message: "Error fetching all feedback", error: err });
  }
};

// Get Feedback by Book ID
const getFeedbackByBookId = async (req, res) => {
  try {
    const { book_id } = req.params;

    const feedbackList = await Feedback.find({ book_id })
      .populate("user_id", "username , image")
      .sort({ date: -1 });

    if (!feedbackList || feedbackList.length === 0) {
      return res.status(404).json({ message: "No feedback found for this book" });
    }

    res.status(200).json(feedbackList);
  } catch (err) {
    console.error("Error fetching feedback by book ID:", err);
    res.status(500).json({ message: "Error fetching feedback by book ID", error: err });
  }
};

// Update Feedback
const updateFeedback = async (req, res) => {
    try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      id,
      { rating, comment, date: Date.now() },
      { new: true }
    );

    if (!updatedFeedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.status(200).json({
      message: "Feedback updated successfully",
      feedback: updatedFeedback,
    });
  } catch (err) {
    console.error("Error updating feedback:", err);
    res.status(500).json({ message: "Error updating feedback", error: err });
  }
};


// Delete Feedback
const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedFeedback = await Feedback.findByIdAndDelete(id);

    if (!deletedFeedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.status(200).json({ message: "Feedback deleted successfully" });
  } catch (err) {
    console.error("Error deleting feedback:", err);
    res.status(500).json({ message: "Error deleting feedback", error: err });
  }
};


// Get Average Rating for a Book
const getAverageRating = async (req, res) => {
  try {
    const { book_id } = req.params;

    // Convert book_id to ObjectId (correct way using `new`)
    const objectId = new mongoose.Types.ObjectId(book_id);

    // Aggregate to calculate average rating
    const averageRating = await Feedback.aggregate([
      { $match: { book_id: objectId } },
      { $group: {
          _id: "$book_id",
          averageRating: { $avg: "$rating" }
      } }
    ]);

    if (!averageRating || averageRating.length === 0) {
      return res.status(404).json({ message: "No feedback found for this book" });
    }

    res.status(200).json({
      book_id: book_id,
      averageRating: averageRating[0].averageRating.toFixed(2)
    });
  } catch (err) {
    console.error("Error fetching average rating:", err);
    res.status(500).json({ message: "Error fetching average rating", error: err });
  }
};


module.exports = {
  addFeedback,
  getAllFeedback,
  getFeedbackByBookId,
  updateFeedback,
  deleteFeedback,
  getAverageRating
};
