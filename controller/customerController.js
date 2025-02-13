const bcrypt = require('bcryptjs');
const Customer = require("../model/customer");
const Credential = require("../model/credential");
const nodemailer = require("nodemailer");

const findAll = async (req,res) => {
    try {
        const customers = await Customer.find();
    res.status(200).json(customers);
    } catch (e) {
        res.json(e)
    }
}

const save = async (req, res) => {
  const { username, full_name, email, contact_no, address, role, password } = req.body;

  try {
    // Validate required fields
    if (!username || !password || !full_name || !email || !contact_no) {
      return res.status(400).json({ message: "All required fields (username, password, full_name, email, contact_no) must be provided" });
    }

    // Check if username already exists
    const existingUser = await Credential.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Check if an image file is provided
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new Credential document
    const cred = new Credential({
      username,
      password: hashedPassword,
      role: role || "User", // Default to "User" if not provided
    });
    await cred.save();

    // Create the Customer document with the same _id
    const customer = new Customer({
      _id: cred._id,
      username,
      full_name,
      email,
      contact_no,
      role: role || "User",
      address,
      image: req.file.filename, // Save image filename like addBook
    });
    await customer.save();

    // Set up nodemailer transporter for sending confirmation email
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "rpurnima8555@gmail.com",
        pass: "kwvuyzwguvdohwzu",
      },
    });

    // Send welcome email to the customer
    const info = await transporter.sendMail({
      from: "rpurnima8555@gmail.com",
      to: customer.email,
      subject: "Welcome to BOOKIT!",
      html: `
        <h1>Welcome, ${customer.full_name}!</h1>
        <p>Your account has been created successfully. Here are your details:</p>
        <ul>
          <li><strong>Username:</strong> ${customer.username}</li>
          <li><strong>Role:</strong> ${customer.role}</li>
          <li><strong>Contact No:</strong> ${customer.contact_no}</li>
        </ul>
        <p>Thank you for joining us!</p>
      `,
    });

    res.status(201).json({ message: "User saved successfully", customer, emailInfo: info });
  } catch (error) {
    console.error("Error saving customer:", error);
    res.status(500).json({ message: "Error saving customer", error: error.message });
  }
};

const findById = async (req,res) => {
    try {
        const customers = await Customer.findById(req.params.id);
    res.status(200).json(customers);
    } catch (e) {
        res.json(e)
    }
}

const deleteById = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete from Customer collection
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Delete from Credential collection using the same _id
    const credential = await Credential.findByIdAndDelete(id);
    if (!credential) {
      return res.status(404).json({ message: "Credential not found for this customer" });
    }

    res.status(200).json({ message: "User deleted from both Customer and Credential collections" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

const update = async (req, res) => {
    try {
        const { role, image, ...otherUpdates } = req.body;

        // Find and update customer, ensuring role and image are handled properly
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            {
                ...otherUpdates,
                role: role || "User", // Ensure role defaults to 'User' if not provided
                image: image || null  // Ensure image is handled properly
            },
            { new: true }
        );

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Update the related credential document
        const cred = await Credential.findOneAndUpdate(
            { _id: customer._id },
            req.body,
            { new: true }
        );

        if (!cred) {
            return res.status(404).json({ message: "Credential not found for this customer" });
        }

        // Send email notification (unchanged)
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: "rpurnima8555@gmail.com",
                pass: "kwvuyzwguvdohwzu"
            }
        });

        const info = await transporter.sendMail({
            from: "rpurnima8555@gmail.com",
            to: customer.email,
            subject: "Your Account Details Have Been Updated",
            html: `
                <h1>Hello ${customer.full_name},</h1>
                <p>Your account details have been successfully updated. Here are your updated details:</p>
                <ul>
                    <li><strong>Full Name:</strong> ${customer.full_name}</li>
                    <li><strong>Username:</strong> ${customer.username}</li>
                    <li><strong>Email:</strong> ${customer.email}</li>
                    <li><strong>Contact Number:</strong> ${customer.contact_no}</li>
                    <li><strong>Address:</strong> ${customer.address}</li>
                    <li><strong>Role:</strong> ${customer.role}</li>
                </ul>
                <p>If you did not request these changes, please contact our support team immediately.</p>
            `
        });

        res.status(200).json({ message: "Customer details updated successfully", customer, cred, emailInfo: info });
    } catch (e) {
        console.error("Error updating customer:", e);
        res.status(500).json({ message: "Failed to update customer details", error: e });
    }
};


// New: Get total customer count
const getCustomerCount = async (req, res) => {
  try {
    const count = await Customer.countDocuments();
    console.log("Total customers in database:", count);
    res.status(200).json({ count });
  } catch (err) {
    console.error("Error fetching customer count:", err);
    res.status(500).json({ message: "Error fetching customer count", error: err.message || err });
  }
};

module.exports = {
  findAll,
  save,
  findById,
  deleteById,
  update,
  getCustomerCount, // Export new function
};