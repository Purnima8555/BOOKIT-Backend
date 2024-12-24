const express = require("express");
const router = express.Router();
const { findAll, save, findById, update } = require("../controller/customerController");
const { deleteUser } = require("../controller/authController");
const CustomerValidation = require("../validation/customerValidation");
const { authenticateToken } = require("../security/authorization");


router.get("/", authenticateToken, findAll);
router.post("/", CustomerValidation, save);
router.get("/:id", findById);
router.delete("/:id", deleteUser);
router.put("/:id", update);

module.exports = router;
