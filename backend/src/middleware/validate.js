const ApiError = require('../utils/apiError');

/**
 * Request body validation middleware factory
 * @param {string[]} requiredFields — fields that must exist and be non-empty
 */
const validate = (requiredFields) => (req, res, next) => {
  const missing = requiredFields.filter(
    (f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === ''
  );

  if (missing.length > 0) {
    return next(ApiError.badRequest(`Missing required fields: ${missing.join(', ')}`));
  }

  next();
};

module.exports = validate;
