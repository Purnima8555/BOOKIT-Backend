const Book = require("../model/book");

// Get all books
const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find();
    console.log("Books retrieved:", books);
    res.status(200).json(books);
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({ message: "Error fetching books", error: err });
  }
};

// Get a specific book by ID
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ message: "Error fetching book", error: err });
  }
};

// Add a new book (Admin only)
const addBook = async (req, res) => {
  const { title, author, genre, price, rental_price, publisher, ISBN, description, available_stock, series } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const newBook = new Book({
      title,
      image: req.file.filename,
      author,
      genre,
      price,
      rental_price,
      publisher,
      ISBN,
      description,
      available_stock,
      series,
    });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(500).json({ message: "Error adding book", error: err });
  }
};

// Update a book by ID (Admin only)
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFields = {};
    const currentBook = await Book.findById(id);

    if (!currentBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Loop over each field and only add to updatedFields if it's provided
    if (req.body.title) updatedFields.title = req.body.title;
    if (req.body.author) updatedFields.author = req.body.author;
    if (req.body.genre) updatedFields.genre = req.body.genre;
    if (req.body.price) updatedFields.price = req.body.price;
    if (req.body.rental_price) updatedFields.rental_price = req.body.rental_price;
    if (req.body.publisher) updatedFields.publisher = req.body.publisher;
    if (req.body.ISBN) updatedFields.ISBN = req.body.ISBN;
    if (req.body.description) updatedFields.description = req.body.description;
    if (req.body.available_stock) updatedFields.available_stock = req.body.available_stock;

    // If the series is provided, update it, otherwise retain default
    if (req.body.series) updatedFields.series = req.body.series;

    if (req.file) {
      const uniqueTimestamp = Date.now();
      const uniqueFilename = `${uniqueTimestamp}-${req.file.originalname}`;

      updatedFields.image = uniqueFilename;

      // Save the file with the unique name to the 'book_images' folder
      const newImagePath = path.join(__dirname, '..', 'book_images', uniqueFilename);
      fs.renameSync(req.file.path, newImagePath);

      // Delete the old image if it exists
      const oldImagePath = path.join(__dirname, '..', 'book_images', currentBook.image);
      fs.exists(oldImagePath, (exists) => {
        if (exists) {
          fs.unlink(oldImagePath, (err) => {
            if (err) {
              console.error("Error deleting the old image:", err);
            } else {
              console.log("Old image deleted successfully");
            }
          });
        } else {
          console.log("Old image not found, skipping deletion.");
        }
      });
    }

    // Find the book by ID and update it with the fields provided
    const updatedBook = await Book.findByIdAndUpdate(id, updatedFields, { new: true });

    if (!updatedBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json({ message: "Book updated successfully", book: updatedBook });
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).json({ message: "Error updating book", error: err });
  }
};


// Delete a book by ID (Admin only)
const deleteBook = async (req, res) => {
  try {
    const deletedBook = await Book.findById(req.params.id);

    if (!deletedBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Delete the image from the book_images folder if it exists
    const imagePath = path.join(__dirname, '..', 'book_images', deletedBook.image);

    // Check if the image exists and delete it
    fs.exists(imagePath, (exists) => {
      if (exists) {
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error("Error deleting the image:", err);
          } else {
            console.log("Image deleted successfully");
          }
        });
      } else {
        console.log("Image not found, skipping deletion.");
      }
    });

    await Book.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).json({ message: "Error deleting book", error: err });
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
};
