const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    full_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    contact_no: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    address: {
        type: String
    },
});

const Customer = mongoose.model('customers', customerSchema);

module.exports = Customer;
