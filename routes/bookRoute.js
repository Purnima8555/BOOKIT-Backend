const express = require("express");
const router = express.Router();

const {
  getAllBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
} = require("../controller/bookController");
const { authenticateToken, authorizeRole } = require("../security/authorization");

const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../book_images");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      console.log('File received:', file);
      cb(null, true);
    },
  });


router.get("/", getAllBooks);
router.get("/:id", getBookById);
router.post("/", authenticateToken, authorizeRole("Admin"), upload.single('file'), addBook);
router.put("/:id", authenticateToken, authorizeRole("Admin"), upload.single('file'), updateBook);
router.delete("/:id", authorizeRole("Admin"), deleteBook);

module.exports = router;
