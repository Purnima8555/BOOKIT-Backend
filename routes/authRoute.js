const express = require("express");
const router = express.Router();
const { register, login, forgotPassword, resetPassword, verifyCode } = require("../controller/authController");
const CustomerValidation = require("../validation/customerValidation");

router.post("/register", CustomerValidation, register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-code", verifyCode);

module.exports = router;
