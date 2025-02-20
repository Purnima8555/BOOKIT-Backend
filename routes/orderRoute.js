const express = require("express");
const router = express.Router();
const {
  placeOrder,
  getOrdersByUser,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  getOrderTypeCounts,
  getCurrentlyReading // Include new function
} = require("../controller/orderController");

const { authenticateToken, authorizeRole } = require("../security/authorization");

router.post("/", authenticateToken, placeOrder);
router.get("/:user_id", authenticateToken, getOrdersByUser);
router.get("/", authenticateToken, authorizeRole("Admin"), getAllOrders);
router.put("/:id", authenticateToken, authorizeRole("Admin"), updateOrderStatus);
router.delete("/:id", authenticateToken, deleteOrder);
router.get("/counts/:user_id", authenticateToken, getOrderTypeCounts);
router.get("/currently-reading/:user_id", authenticateToken, getCurrentlyReading); // New route

module.exports = router;