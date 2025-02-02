const express = require("express");
const path = require("path");
const connectDb = require("./config/db");
const CustomerRouter = require("./routes/customerRoute");
const AuthRouter = require("./routes/authRoute");
const BookRouter = require("./routes/bookRoute");
const feedbackRouter = require("./routes/feedbackRoute");
const favoriteRouter = require("./routes/favoriteRoute");
const cartRouter = require("./routes/cartRoute");
const orderRouter = require("./routes/orderRoute");

const app = express();

connectDb();

app.use(express.json());
app.use("/book_images", express.static(path.join(__dirname, "book_images")));
// app.use('/profilePicture', express.static(path.join(__dirname, 'public', 'profilePicture')));

app.use("/api/customer", CustomerRouter);
app.use("/api/auth", AuthRouter);
app.use("/api/books", BookRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/favorites", favoriteRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/profilePicture", express.static("public/profilePicture"));


const port = 3000;
app.listen(port, () => {
console.log(`Server running at http://localhost:${port}`);
});
