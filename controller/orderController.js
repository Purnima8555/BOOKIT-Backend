const Order = require("../model/order");
const Cart = require("../model/cart");
const Customer = require("../model/customer");
const mongoose = require("mongoose");


// Place an order
const placeOrder = async (req, res) => {
  try {
    // Extract data from request
    const { items, total_price, orderType } = req.body;
    const username = req.user.username;

    // Find the user in the database using the username
    const customer = await Customer.findOne({ username });
    if (!customer) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate orderType
    if (!["Purchase", "Rent"].includes(orderType)) {
      return res.status(400).json({ message: "Invalid order type" });
    }

    // Validate rental duration for Rent orders
    if (orderType === "Rent") {
      for (let item of items) {
        if (!item.rentDuration || item.rentDuration <= 0) {
          return res.status(400).json({ message: "Invalid rental duration for rent order" });
        }
      }
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items to place in order" });
    }

    // Create the new order
    const newOrder = new Order({
      user_id: customer._id,
      orderType,
      items,
      total_price,
    });

    await newOrder.save();

    // Optionally clear the user's cart after placing the order
    await Cart.deleteMany({ user_id: customer._id });

    res.status(201).json({ message: "Order placed successfully", order: newOrder });
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).json({ message: "Error placing order", error: err.message });
  }
};


// Get All Orders for a User
const getOrdersByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const orders = await Order.find({ user_id })
      .populate("items.book_id", "title price")
      .sort({ order_date: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this user" });
    }

    // Ensure total_price is included for each order
    const ordersWithTotalPrice = orders.map(order => ({
      id: order._id,
      orderType: order.orderType,
      items: order.items,
      total_price: order.total_price, // Include total price
      status: order.status,
      order_date: order.order_date,
    }));

    res.status(200).json(ordersWithTotalPrice);
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
      .populate("items.book_id", "title price")
      .sort({ order_date: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    // Ensure total_price is included for each order
    const ordersWithTotalPrice = orders.map(order => ({
      id: order._id,
      user: order.user_id,
      orderType: order.orderType,
      items: order.items,
      total_price: order.total_price, // Include total price
      status: order.status,
      order_date: order.order_date,
    }));

    res.status(200).json(ordersWithTotalPrice);
  } catch (err) {
    console.error("Error fetching all orders:", err);
    res.status(500).json({ message: "Error fetching all orders", error: err.message });
  }
};


// Update Order Status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    // Validate the status
    const validStatuses = ["Pending", "Processing", "Shipped", "Delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order status updated successfully", order: updatedOrder });
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


module.exports = {
  placeOrder,
  getOrdersByUser,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
};
