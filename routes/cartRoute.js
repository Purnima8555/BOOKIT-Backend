const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../security/authorization");
const {
  addToCart,
  getCartByUser,
  updateCartItem,
  removeFromCart,
  clearCart
} = require("../controller/cartController");


router.post("/add", authenticateToken, addToCart);
router.get("/:user_id", getCartByUser);
router.patch("/update/:id", updateCartItem);
router.delete("/remove/:id", removeFromCart);
router.delete("/clear/:user_id", clearCart);

module.exports = router;
