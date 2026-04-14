const Joi = require("joi");

// Message schema
const messageSchema = Joi.object({

  roomId: Joi.string()
    .min(1)
    .required(),

  message: Joi.string()
    .min(1)
    .max(1000)
    .required()

});

module.exports = {
  messageSchema
};