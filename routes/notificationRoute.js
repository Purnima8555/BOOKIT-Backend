const express = require("express");
const router = express.Router();
const { getByUserId, patchMarkAsRead, getAllForAdmin } = require("../controller/notificationController");
const { authenticateToken } = require("../security/authorization");

router.get("/user", authenticateToken, getByUserId); // Fetch user's notifications
router.patch("/:id", authenticateToken, patchMarkAsRead); // Mark as read
router.get("/all", authenticateToken, getAllForAdmin); // Fetch all notifications (admin only)

module.exports = router;