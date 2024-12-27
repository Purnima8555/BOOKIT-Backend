const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Customer" // Reference to the Customer collection
    },
    email: {
        type: String,
        required: true
    },
    code: {
        type: String, // Store the 6-digit verification code as a string
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
});

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
