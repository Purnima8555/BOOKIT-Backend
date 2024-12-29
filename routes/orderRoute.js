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

router.post("/", authenticateToken, placeOrder);
router.get("/:user_id", authenticateToken, getOrdersByUser);
router.get("/", authenticateToken, authorizeRole("Admin"), getAllOrders);
router.put("/:id", authenticateToken, authorizeRole("Admin"), updateOrderStatus);
router.delete("/:id", authenticateToken, deleteOrder);

module.exports = router;
