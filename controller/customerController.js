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
    try {
        const { username, full_name, email, contact_no, address, role, image } = req.body;

        // Create new customer with default role "User" if not provided
        const customer = new Customer({
            username,
            full_name,
            email,
            contact_no,
            address,
            role: role || "User",  // Default to 'User' if not provided
            image: image || null   // Default to null if image not provided
        });

        await customer.save();
        res.status(201).json(customer);
    } catch (e) {
        res.status(500).json({ message: "Error saving customer", error: e });
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

const deleteById = async (req,res) => {
    try {
        const customers = await Customer.findByIdAndDelete(req.params.id);
    res.status(200).json("Data Deleted");
    } catch (e) {
        res.json(e)
    }
}

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


module.exports= {
    findAll,
    save,
    findById,
    deleteById,
    update
}