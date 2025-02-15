const express = require("express");
const router = express.Router();
const {
  submitBookRequest,
  getPendingBookRequestCount,
  getAllBookRequests,
  updateBookRequest
} = require("../controller/bookRequestController");
const { authenticateToken } = require("../security/authorization");

router.post("/", authenticateToken, submitBookRequest);
router.get("/pending/count", authenticateToken, getPendingBookRequestCount);
router.get("/all", authenticateToken, getAllBookRequests); // New route for all requests
router.put("/:id", authenticateToken, updateBookRequest);  // New route for updating status

module.exports = router;