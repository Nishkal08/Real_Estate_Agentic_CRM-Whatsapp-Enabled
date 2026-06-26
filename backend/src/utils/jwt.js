const jwt = require('jsonwebtoken');

const ACCESS_EXPIRES  = '15m';
const REFRESH_EXPIRES = '7d';

/**
 * Generate access + refresh token pair
 */
const generateTokens = (userId, businessId) => ({
  accessToken:  jwt.sign({ userId, businessId }, process.env.JWT_SECRET,         { expiresIn: ACCESS_EXPIRES }),
  refreshToken: jwt.sign({ userId, businessId }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES }),
});

/**
 * Verify access token — returns payload or throws
 */
const verifyAccess = (token) => jwt.verify(token, process.env.JWT_SECRET);

/**
 * Verify refresh token — returns payload or throws
 */
const verifyRefresh = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

module.exports = { generateTokens, verifyAccess, verifyRefresh };
