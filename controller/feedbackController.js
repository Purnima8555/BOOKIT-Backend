const Customer = require("../model/customer");
const Feedback = require("../model/feedback");
const mongoose = require("mongoose");


// Add Feedback for a Book
const addFeedback = async (req, res) => {
  try {
    const { user_id, book_id, rating, comment } = req.body;

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

    // Fetch username and image from Customer
    const user = await Customer.findById(user_id).select("username image");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Construct response matching getFeedbackByBookId structure
    const feedbackResponse = {
      _id: newFeedback._id,
      user_id: newFeedback.user_id,
      book_id: newFeedback.book_id,
      rating: newFeedback.rating,
      comment: newFeedback.comment,
      date: newFeedback.date,
      __v: newFeedback.__v,
      username: user.username
    };

    res.status(201).json({
      message: "Feedback added successfully",
      feedback: feedbackResponse,
    });
  } catch (err) {
    console.error("Error adding feedback:", err);
    res.status(500).json({ message: "Error adding feedback", error: err.message });
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
    res.status(500).json({ message: "Error fetching all feedback", error: err.message });
  }
};


// Get Feedback by Book ID
const getFeedbackByBookId = async (req, res) => {
  try {
    const { book_id } = req.params;

    const feedbackList = await Feedback.find({ book_id }).sort({ date: -1 });

    // Transform feedback to include username as a separate field
    const populatedFeedback = await Promise.all(
      feedbackList.map(async (feedback) => {
        const user = await Customer.findById(feedback.user_id).select("username image");
        return {
          _id: feedback._id,
          user_id: feedback.user_id,
          book_id: feedback.book_id,
          rating: feedback.rating,
          comment: feedback.comment,
          date: feedback.date,
          __v: feedback.__v,
          username: user ? user.username : "Unknown",
          image: user ? user.image : null,
        };
      })
    );

    res.status(200).json(populatedFeedback.length > 0 ? populatedFeedback : []);
  } catch (err) {
    console.error("Error fetching feedback by book ID:", err);
    res.status(500).json({ message: "Error fetching feedback by book ID", error: err.message });
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
    res.status(500).json({ message: "Error updating feedback", error: err.message });
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
    res.status(500).json({ message: "Error deleting feedback", error: err.message });
  }
};


// Get Average Rating for a Book
const getAverageRating = async (req, res) => {
  try {
    const { book_id } = req.params;

    // Convert book_id to ObjectId
    const objectId = new mongoose.Types.ObjectId(book_id);

    // Aggregate to calculate average rating
    const averageRating = await Feedback.aggregate([
      { $match: { book_id: objectId } },
      {
        $group: {
          _id: "$book_id",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    // If no feedback exists, return 0 rating with a success status
    if (!averageRating || averageRating.length === 0) {
      return res.status(200).json({
        book_id: book_id,
        averageRating: 0,
        totalReviews: 0,
      });
    }

    res.status(200).json({
      book_id: book_id,
      averageRating: parseFloat(averageRating[0].averageRating.toFixed(2)),
      totalReviews: averageRating[0].totalReviews,
    });
  } catch (err) {
    console.error("Error fetching average rating:", err);
    res.status(500).json({ message: "Error fetching average rating", error: err.message });
  }
};

module.exports = {
  addFeedback,
  getAllFeedback,
  getFeedbackByBookId,
  updateFeedback,
  deleteFeedback,
  getAverageRating,
};