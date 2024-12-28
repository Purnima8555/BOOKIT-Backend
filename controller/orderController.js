const Order = require("../model/order");
const Cart = require("../model/cart");

// Place an Order
const placeOrder = async (req, res) => {
  try {
    // Get user_id from the token
    const user_id = req.user.username;
    const { items, total_price } = req.body;

    // Ensure cart has items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items to place in order" });
    }

    // Create a new order
    const newOrder = new Order({
      user_id, // Use user_id from token
      items,
      total_price,
    });

    await newOrder.save();

    // Optionally clear user's cart after placing the order
    await Cart.deleteMany({ user_id });

    res.status(201).json({ message: "Order placed successfully", order: newOrder });
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).json({ message: "Error placing order", error: err });
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

    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Error fetching orders", error: err });
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

    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching all orders:", err);
    res.status(500).json({ message: "Error fetching all orders", error: err });
  }
};


// Update Order Status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["Pending", "Processing", "Shipped", "Delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

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
    res.status(500).json({ message: "Error updating order status", error: err });
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
    res.status(500).json({ message: "Error deleting order", error: err });
  }
};


module.exports = {
  placeOrder,
  getOrdersByUser,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
};
