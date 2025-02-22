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
router.get("/all", authenticateToken, getAllBookRequests);
router.put("/:id", authenticateToken, updateBookRequest);

module.exports = router;