const Book = require("../model/book");
const path = require("path");
const fs = require("fs");


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

const addBook = async (req, res) => {
  const { 
    title, 
    author, 
    genre, // This is the genre field
    price, 
    rental_price, 
    publisher, 
    ISBN, 
    description, 
    series, 
    isAvailable, 
    available_stock, 
    hasDiscount, 
    discount_type, 
    discount_percent, 
    discount_start, 
    discount_end 
  } = req.body;

  try {
    // Parse genre if it's a string (i.e., it looks like a JSON array string)
    let parsedGenre = [];
    if (typeof genre === 'string') {
      try {
        parsedGenre = JSON.parse(genre); // Parse string into an array
      } catch (e) {
        return res.status(400).json({ message: "Invalid genre format. Expected an array." });
      }
    } else {
      parsedGenre = genre; // If it's already an array, use it directly
    }

    // Check if the ISBN already exists in the database
    const existingBook = await Book.findOne({ ISBN });
    if (existingBook) {
      return res.status(400).json({ message: "ISBN already exists" });
    }

    // Check if an image file is provided
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const newBook = new Book({
      title,
      image: req.file.filename,
      author,
      genre: parsedGenre, // Save parsed genre array
      price,
      rental_price,
      publisher,
      ISBN,
      description,
      series,
      isAvailable: isAvailable || 'no',
      available_stock,
      hasDiscount: hasDiscount || 'no',
      discount_type: discount_type || '',
      discount_percent: discount_percent || null,
      discount_start: discount_start || '',
      discount_end: discount_end || '',
    });

    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(500).json({ message: "Error adding book", error: err });
  }
};


// Update book data
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

    // ✅ FIXED: Ensure genre is always stored as an array
    if (req.body.genre) {
      updatedFields.genre = Array.isArray(req.body.genre)
        ? req.body.genre
        : req.body.genre.split(",").map(item => item.trim());
    }

    if (req.body.price) updatedFields.price = req.body.price;
    if (req.body.rental_price) updatedFields.rental_price = req.body.rental_price;
    if (req.body.publisher) updatedFields.publisher = req.body.publisher;
    if (req.body.ISBN) updatedFields.ISBN = req.body.ISBN;
    if (req.body.description) updatedFields.description = req.body.description;
    if (req.body.series) updatedFields.series = req.body.series;
    if (req.body.isAvailable) updatedFields.isAvailable = req.body.isAvailable;
    if (req.body.available_stock) updatedFields.available_stock = req.body.available_stock;

    if (req.body.hasDiscount === "true" || req.body.hasDiscount === true) {
      updatedFields.hasDiscount = true;
      if (req.body.discount_type) updatedFields.discount_type = req.body.discount_type;
      updatedFields.discount_percent = Number(req.body.discount_percent) || 0;
      if (req.body.discount_start) updatedFields.discount_start = req.body.discount_start;
      if (req.body.discount_end) updatedFields.discount_end = req.body.discount_end;
    } else {
      updatedFields.hasDiscount = false;
      updatedFields.discount_type = undefined;
      updatedFields.discount_percent = undefined;
      updatedFields.discount_start = undefined;
      updatedFields.discount_end = undefined;
    }

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
    res.status(500).json({ message: "Error updating book", error: err.message || err });
  }
};


// Get books by genre
const getByGenre = async (req, res) => {
  try {
    const { genre } = req.params;
    
    // Query the database for books that have the genre
    const books = await Book.find({
      genre: { $in: [genre] } // Use MongoDB $in operator to check if the genre is in the array
    });

    if (books.length === 0) {
      return res.status(404).json({ message: `No books found for genre: ${genre}` });
    }

    res.status(200).json(books);
  } catch (err) {
    console.error('Error getting books by genre:', err);
    res.status(500).json({ message: "Error retrieving books by genre", error: err });
  }
};


const getNewBooks = async (req, res) => {
  try {
    // Fetch the latest 10 books ordered by createdAt (desc)
    const books = await Book.find().sort({ createdAt: -1 }).limit(10);
    
    if (books.length === 0) {
      return res.status(404).json({ message: "No new books found" });
    }

    res.status(200).json(books);
  } catch (err) {
    console.error("Error fetching new books:", err);
    res.status(500).json({ message: "Error fetching new books", error: err });
  }
};


const getBestBooks = async (req, res) => {
  try {
    // Aggregate books with reviews and ratings
    const books = await Book.aggregate([
      {
        $lookup: {
          from: "feedbacks", // The name of the collection for feedbacks (adjust if different)
          localField: "_id",  // Field in the Book collection
          foreignField: "book_id", // Field in the Feedback collection
          as: "reviews", // Join the reviews as an array
        },
      },
      {
        $match: {
          "reviews.0": { $exists: true }, // Filter out books that have no reviews
        },
      },
      {
        $addFields: {
          averageRating: {
            $avg: "$reviews.rating", // Calculate average rating
          },
        },
      },
      {
        $sort: {
          averageRating: -1, // Sort by the average rating, highest first
        },
      },
      {
        $limit: 10, // Limit to top 10 books
      },
      {
        $project: {
          title: 1, // Include book fields you want to return
          author: 1,
          image: 1, // Include the image field
          price: 1, // Include the price field
          averageRating: 1, // Include the calculated average rating
          reviewsCount: { $size: "$reviews" }, // Count the number of reviews for each book
        },
      },
    ]);

    if (books.length === 0) {
      return res.status(404).json({ message: "No top-rated books found" });
    }

    res.status(200).json(books);
  } catch (err) {
    console.error("Error fetching best books:", err);
    res.status(500).json({ message: "Error fetching best books", error: err });
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
  getByGenre,
  getNewBooks,
  getBestBooks,
  deleteBook,
};
