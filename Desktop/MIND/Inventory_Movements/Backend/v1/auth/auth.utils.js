const Joi = require("joi");

const signupUserSchema = Joi.object({
  first_name: Joi.string().min(1).max(255).required(),
  last_name: Joi.string().min(1).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(4).required(),
  branch: Joi.string().min(3).required(),
});
const loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(4).required(),
});
module.exports = { signupUserSchema, loginUserSchema };
