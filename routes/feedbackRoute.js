const express = require("express");
const router = express.Router();
const {
  getAllFeedback,
  getFeedbackByBookId,
  addFeedback,
  updateFeedback,
  deleteFeedback,
  getAverageRating
} = require("../controller/feedbackController");

const { authenticateToken } = require("../security/authorization");

router.get("/", getAllFeedback);
router.get("/book/:book_id", getFeedbackByBookId);
router.get("/average-rating/:book_id", getAverageRating);
router.post("/", addFeedback);
router.patch("/:id", updateFeedback);
router.delete("/:id", deleteFeedback);

module.exports = router;
