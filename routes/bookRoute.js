const express = require("express");
const router = express.Router();

const {
  getAllBooks,
  getBookById,
  addBook,
  updateBook,
  getByGenre,
  getNewBooks,
  getBestBooks,
  deleteBook,
  searchByTitleAndISBN,
  searchByAuthor,
  searchBySeries,
  getBookCount,
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
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, and PNG are allowed.'), false);
    }
  },
});

// Specific routes first
router.get("/count", authenticateToken, getBookCount);
router.get("/", getAllBooks);
router.get("/genre/:genre", getByGenre);
router.get("/new/newbooks", getNewBooks);
router.get("/best/bestbooks", getBestBooks);
router.get("/search/title-isbn", searchByTitleAndISBN);
router.get("/search/author", searchByAuthor);
router.get("/search/series", searchBySeries);

// Dynamic routes after specific routes
router.get("/:id", getBookById);
router.post("/add", upload.single("image"), authenticateToken, addBook);
router.put("/update/:id", upload.single("image"), authenticateToken, updateBook);
router.delete("/delete/:id", authenticateToken, deleteBook);

module.exports = router;