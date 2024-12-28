const express = require("express");
const router = express.Router();
const {
  placeOrder,
  getOrdersByUser,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} = require("../controller/orderController");

const { authenticateToken, authorizeRole } = require("../security/authorization");

// Place a new order (Protected for any logged-in user)
router.post("/", authenticateToken, placeOrder);

// Get all orders for a specific user (Protected for any logged-in user)
router.get("/:user_id", authenticateToken, getOrdersByUser);

// Get all orders (Protected and restricted to admin role)
router.get("/", authenticateToken, authorizeRole("Admin"), getAllOrders);

// Update the status of an order (Restricted to admin role)
router.patch("/:id", authenticateToken, authorizeRole("Admin"), updateOrderStatus);

// Delete an order (Protected for any logged-in user)
router.delete("/:id", authenticateToken, deleteOrder);

module.exports = router;
