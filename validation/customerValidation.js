const joi = require("joi");

const customerSchema = joi.object({
    full_name: joi.string().required(),
    email: joi.string().required().email(),
    contact_no: joi.string().required(),
    address: joi.string().optional(),
    username: joi.string().required(),
    password: joi.string().required(),
    confirmPassword: joi.string().valid(joi.ref('password')).required(),
    role: joi.string().required(),
});

function CustomerValidation(req, res, next) {
    const { error } = customerSchema.validate(req.body);
    if (error) {
        return res.status(400).json(error.details[0].message);
    }
    next();
}

module.exports = CustomerValidation;
