const Order = require("../model/order");
const Cart = require("../model/cart");
const Customer = require("../model/customer");
const Book = require("../model/book");
const Notification = require("../model/notification");
const mongoose = require("mongoose");


// Place an order
const placeOrder = async (req, res) => {
  try {
    const { user_id, items, deliveryFee, total, paymentMethod } = req.body;
    const tokenUser = req.user;

    const customer = await Customer.findOne({ username: tokenUser.username });
    if (!customer || customer._id.toString() !== user_id) {
      return res.status(403).json({ message: "Unauthorized user" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    if (!["cod", "online", "esewa"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    let calculatedSubtotal = 0;
    for (const item of items) {
      const { book_id, quantity, type, rentalDays } = item;

      if (!book_id || !quantity || !type) {
        return res.status(400).json({ message: "Missing required item fields" });
      }
      if (!["purchase", "rental"].includes(type)) {
        return res.status(400).json({ message: `Invalid type for item ${book_id}` });
      }
      if (type === "rental" && (!rentalDays || rentalDays <= 0)) {
        return res.status(400).json({ message: `Invalid rentalDays for item ${book_id}` });
      }

      const book = await Book.findById(book_id);
      if (!book) {
        return res.status(404).json({ message: `Book ${book_id} not found` });
      }

      const price = type === "purchase" ? book.price : book.rental_price * (rentalDays / 7);
      calculatedSubtotal += price * quantity;
    }

    const calculatedTotal = calculatedSubtotal + (deliveryFee || 0);
    if (Math.round(calculatedTotal * 100) / 100 !== Math.round(total * 100) / 100) {
      console.log(`Calculated Total: ${calculatedTotal}, Sent Total: ${total}`);
    return res.status(400).json({ message: "Total mismatch. Possible tampering detected." });
  }
    const newOrder = new Order({
      user_id,
      items,
      deliveryFee: deliveryFee || 0,
      total_price: total,
      paymentMethod,
      paymentStatus: paymentMethod === "online" ? "done" : "not done",
    });

    await newOrder.save();
    console.log("Order saved successfully:", newOrder._id);

    let firstBookTitle;
    try {
      const book = await Book.findById(items[0].book_id);
      firstBookTitle = book ? book.title : "Unknown Book";
    } catch (err) {
      console.error("Error fetching book title for notification:", err);
      firstBookTitle = "Unknown Book";
    }

    const userMessage =
      items.length === 1
        ? `Your order for "${firstBookTitle}" has been placed successfully. We'll notify you once it is shipped.`
        : `Your order for "${firstBookTitle}" and ${items.length - 1} been placed successfully. We'll notify you once it is shipped`;
    const userNotification = new Notification({
      userId: user_id,
      message: userMessage,
      type: "success",
      relatedId: newOrder._id,
      relatedModel: "Order",
    });
    await userNotification.save();
    console.log("User notification saved");

    const adminMessage =
      items.length === 1
        ? `An order for book "${firstBookTitle}" has been placed.`
        : `An order for "${firstBookTitle}" and ${items.length - 1} other book(s) has been placed.`;
    let adminUsers;
    try {
      adminUsers = await Customer.find({ role: "Admin" });
      if (!adminUsers || adminUsers.length === 0) {
        console.warn("No admin users found");
        adminUsers = [];
      }
    } catch (err) {
      console.error("Error fetching admin users:", err);
      adminUsers = [];
    }

    const adminNotifications = adminUsers.map(admin => new Notification({
      userId: admin._id,
      message: adminMessage,
      type: "warning",
      relatedId: newOrder._id,
      relatedModel: "Order",
    }));
    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
      console.log("Admin notifications saved");
    } else {
      console.log("No admin notifications to save");
    }

    try {
      const cart = await Cart.findOne({ user_id });
      if (cart && cart.items.length === items.length) {
        await Cart.deleteMany({ user_id });
        console.log("Cart deleted");
      }
    } catch (err) {
      console.error("Error deleting cart:", err);
    }

    res.status(201).json({
      _id: newOrder._id,
      user_id: newOrder.user_id,
      items: newOrder.items.map(item => ({
        book_id: item.book_id,
        quantity: item.quantity,
        type: item.type,
        rentalDays: item.rentalDays,
      })),
      deliveryFee: newOrder.deliveryFee,
      total: newOrder.total_price,
      paymentMethod: newOrder.paymentMethod,
      paymentStatus: newOrder.paymentStatus,
      status: newOrder.status || "Pending",
      order_date: newOrder.createdAt || new Date(),
    });
  } catch (err) {
    console.error("Error in placeOrder:", err);
    res.status(500).json({ message: "Error placing order", error: err.message });
  }
};


// Get All Orders for a User
const getOrdersByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const orders = await Order.find({ user_id })
      .populate("items.book_id", "title price rental_price")
      .sort({ order_date: -1 });

    // Return empty array if no orders exist, not an error
    res.status(200).json(orders.length > 0 ? orders.map(order => ({
      id: order._id,
      user_id: order.user_id,
      items: order.items,
      deliveryFee: order.deliveryFee,
      total_price: order.total_price,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      status: order.status,
      order_date: order.order_date,
    })) : []);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Error fetching orders", error: err.message });
  }
};


// Get All Orders (Admin)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user_id", "full_name email")
      .populate("items.book_id", "title price rental_price")
      .sort({ order_date: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    const ordersWithDetails = orders.map(order => ({
      id: order._id,
      user: order.user_id,
      items: order.items,
      deliveryFee: order.deliveryFee,
      total_price: order.total_price,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      status: order.status,
      order_date: order.order_date,
    }));

    res.status(200).json(ordersWithDetails);
  } catch (err) {
    console.error("Error fetching all orders:", err);
    res.status(500).json({ message: "Error fetching all orders", error: err.message });
  }
};


// Update Order Status (and optionally Payment Status)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const validStatuses = ["Pending", "Processing", "Shipped", "Delivered"];
    const validPaymentStatuses = ["done", "not done"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order updated successfully", order: updatedOrder });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};


// Delete an Order
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ message: "Error deleting order", error: err.message });
  }
};


// New function: Get count of purchased and rented items for a user
const getOrderTypeCounts = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Validate user_id
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Fetch all orders for the user
    const orders = await Order.find({ user_id });

    // Initialize counters
    let purchaseCount = 0;
    let rentCount = 0;

    // Iterate through orders and count items by type
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.type === "purchase") {
          purchaseCount += item.quantity;
        } else if (item.type === "rental") {
          rentCount += item.quantity;
        }
      });
    });

    // Return counts
    res.status(200).json({
      purchaseCount,
      rentCount,
    });
  } catch (err) {
    console.error("Error fetching order type counts:", err);
    res.status(500).json({ message: "Error fetching order type counts", error: err.message });
  }
};


// New function: Get currently reading books (rentals with status "Delivered")
const getCurrentlyReading = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Validate user_id
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Fetch orders with status "Delivered" for the user
    const orders = await Order.find({
      user_id,
      status: "Delivered",
      "items.type": "rental"
    }).populate("items.book_id", "title price rental_price image");

    // Process orders to extract rental books
    let currentlyReading = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.type === "rental") {
          currentlyReading.push({
            book_id: item.book_id._id,
            title: item.book_id.title,
            quantity: item.quantity,
            rental_price: item.book_id.rental_price,
            image: item.book_id.image
          });
        }
      });
    });

    // Calculate total count of rented books
    const count = currentlyReading.reduce((total, item) => total + item.quantity, 0);

    // Return count and book details
    res.status(200).json({
      count,
      books: currentlyReading
    });
  } catch (err) {
    console.error("Error fetching currently reading books:", err);
    res.status(500).json({ message: "Error fetching currently reading books", error: err.message });
  }
};

module.exports = {
  placeOrder,
  getOrdersByUser,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  getOrderTypeCounts,
  getCurrentlyReading
};