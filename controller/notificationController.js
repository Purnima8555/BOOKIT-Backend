const Notification = require("../model/notification");

// Get notifications by user ID (all notifications, not just unread)
const getByUserId = async (req, res) => {
  try {
    console.log("Full req.user:", req.user); // Log entire req.user object
    const userId = req.user?.userId; // Safely access userId

    if (!userId) {
      console.error("No userId found in req.user");
      return res.status(401).json({ message: "User ID not found in token" });
    }

    console.log("Fetching notifications for userId from JWT:", userId);
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .populate("relatedId", "title author");

    console.log("Notifications found:", notifications);

    if (notifications.length === 0) {
      console.log("No notifications found for userId:", userId);
    }

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res.status(500).json({ message: "Error fetching user notifications", error: error.message });
  }
};

// Mark a notification as read
const patchMarkAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "User ID not found in token" });
    }

    console.log("Marking notification as read for userId:", userId, "notificationId:", id);
    const notification = await Notification.findOne({ _id: id, userId });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found or not authorized" });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Error marking notification as read", error: error.message });
  }
};

// Get all notifications for admin (only type: "warning")
const getAllForAdmin = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: "User ID not found in token" });
    }

    console.log("Fetching all notifications for admin userId:", userId, "role:", role);
    if (role !== "Admin") {
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    // Filter for only "warning" type notifications (admin-specific)
    const notifications = await Notification.find({ type: "warning" })
      .sort({ createdAt: -1 })
      .populate("userId", "full_name username email")
      .populate("relatedId", "title author");

    console.log("Admin notifications found:", notifications);

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching all notifications for admin:", error);
    res.status(500).json({ message: "Error fetching all notifications", error: error.message });
  }
};

module.exports = { getByUserId, patchMarkAsRead, getAllForAdmin };