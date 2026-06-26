const { verifyAccess } = require('../utils/jwt');
const ApiError = require('../utils/apiError');

/**
 * JWT auth middleware — extracts userId + businessId from token
 * Attaches to req.user
 */
const auth = (req, res, next) => {
  try {
    // Service-to-service internal call check
    const serviceToken = req.headers['x-service-token'];
    if (serviceToken && serviceToken === process.env.JWT_SECRET) {
      req.user = {
        userId:     'service',
        businessId: req.headers['x-business-id'] || 'default',
      };
      return next();
    }

    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing or malformed authorization header');
    }

    const token = header.split(' ')[1];
    const payload = verifyAccess(token);

    req.user = {
      userId:     payload.userId,
      businessId: payload.businessId,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expired'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid token'));
    }
    next(err);
  }
};

module.exports = auth;
