const BookRequest = require("../model/bookRequest");
const Customer = require("../model/customer");
const Notification = require("../model/notification");
const { authenticateToken } = require("../security/authorization");

// Submit a new book request
const submitBookRequest = async (req, res) => {
  const { userId, title, author, isbn, urgency, reason, additionalInfo } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!title || !author) {
      return res.status(400).json({ message: "Title and author are required" });
    }

    const bookRequest = new BookRequest({
      userId,
      title,
      author,
      isbn: isbn || "",
      urgency: urgency || "normal",
      reason: reason || "not-in-system",
      additionalInfo: additionalInfo || "",
    });

    await bookRequest.save();

    const user = await Customer.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userNotification = new Notification({
      userId,
      message: `Your request for "${title}" by ${author} has been submitted and is awaiting admin approval.`,
      type: "info",
      relatedId: bookRequest._id,
    });

    const admins = await Customer.find({ role: "Admin" });
    if (admins.length === 0) {
      console.warn("No admins found to notify");
    }

    const adminNotifications = admins.map((admin) => new Notification({
      userId: admin._id,
      message: `New book request awaiting approval: "${title}" by ${author} (User: ${user.full_name || user.username}, Request ID: ${bookRequest._id.toString()})`,
      type: "warning",
      relatedId: bookRequest._id,
    }));

    await Promise.all([
      userNotification.save(),
      ...adminNotifications.map((notification) => notification.save()),
    ]);

    res.status(201).json({
      message: "Book request submitted successfully and notifications created",
      requestId: bookRequest._id.toString(),
      bookRequest,
    });
  } catch (error) {
    console.error("Error submitting book request:", error);
    res.status(500).json({ message: "Error submitting book request", error: error.message });
  }
};

// Get count of pending book requests
const getPendingBookRequestCount = async (req, res) => {
  try {
    const count = await BookRequest.countDocuments({ status: "pending" });
    console.log("Total pending book requests:", count);
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching pending book request count:", error);
    res.status(500).json({ message: "Error fetching pending book request count", error: error.message || error });
  }
};

// New: Get all book requests (for admins)
const getAllBookRequests = async (req, res) => {
  try {
    const role = req.user?.role;

    if (role !== "Admin") {
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    const bookRequests = await BookRequest.find()
      .sort({ createdAt: -1 }) // Newest first
      .populate("userId", "full_name username email");

    console.log("All book requests retrieved:", bookRequests);
    res.status(200).json(bookRequests);
  } catch (error) {
    console.error("Error fetching all book requests:", error);
    res.status(500).json({ message: "Error fetching all book requests", error: error.message || error });
  }
};

// New: Update book request status (for admins)
const updateBookRequest = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const role = req.user?.role;

    if (role !== "Admin") {
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    // Updated to include "fulfilled" in valid statuses
    if (!status || !["pending", "approved", "rejected", "fulfilled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'pending', 'approved', 'rejected', or 'fulfilled'" });
    }

    const bookRequest = await BookRequest.findById(id);
    if (!bookRequest) {
      return res.status(404).json({ message: "Book request not found" });
    }

    // Update status
    bookRequest.status = status;
    await bookRequest.save();

    // Notify the requesting user
    const user = await Customer.findById(bookRequest.userId);
    if (!user) {
      console.warn("User not found for notification:", bookRequest.userId);
    } else {
      const userNotification = new Notification({
        userId: bookRequest.userId,
        message: `Your request for "${bookRequest.title}" by ${bookRequest.author} has been ${status}. Request ID: ${bookRequest._id.toString()}`,
        type: status === "approved" || status === "fulfilled" ? "success" : "error",
        relatedId: bookRequest._id,
      });
      await userNotification.save();
      console.log(`Notification sent to user ${user._id} for status: ${status}`);
    }

    console.log(`Book request ${id} updated to status: ${status}`);
    res.status(200).json({ message: "Book request updated successfully", bookRequest });
  } catch (error) {
    console.error("Error updating book request:", error);
    res.status(500).json({ message: "Error updating book request", error: error.message || error });
  }
};

module.exports = { submitBookRequest, getPendingBookRequestCount, getAllBookRequests, updateBookRequest };