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
    // Define allowed file types
    const allowedTypes = /jpeg|jpg|png/;
    
    // Check if the file type matches the allowed types
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true); // Accept the file
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, and PNG are allowed.'), false); // Reject the file
    }
  },
});

router.get("/", getAllBooks);
router.get("/:id", getBookById);
router.get("/genre/:genre", getByGenre);
router.get("/new/newbooks", getNewBooks);
router.get("/best/bestbooks", getBestBooks);
router.post("/", upload.single('file'), addBook);
router.put("/:id", upload.single('file'), updateBook);
router.delete("/:id", authorizeRole("Admin"), deleteBook);

module.exports = router;
