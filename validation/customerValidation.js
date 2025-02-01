const Joi = require("joi");

const customerSchema = Joi.object({
    full_name: Joi.string().required(),
    email: Joi.string().required().email(),
    contact_no: Joi.string().required(),
    address: Joi.string().allow("", null).optional(),
    username: Joi.string().required(),
    password: Joi.string().required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
    role: Joi.string().valid("User", "Admin").default("User"), // Default role
    image: Joi.string().allow("", null).optional(), // Allow optional image
});

function CustomerValidation(req, res, next) {
    const { error, value } = customerSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({ message: error.details.map((err) => err.message) });
    }

    // Ensure role defaults to "User" if not provided
    req.body = value; 

    next();
}

module.exports = CustomerValidation;
