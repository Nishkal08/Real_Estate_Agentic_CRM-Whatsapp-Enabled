/**
 * Custom API error — carries HTTP status code for the error handler
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }

  static badRequest(msg)    { return new ApiError(400, msg); }
  static unauthorized(msg)  { return new ApiError(401, msg || 'Unauthorized'); }
  static forbidden(msg)     { return new ApiError(403, msg || 'Forbidden'); }
  static notFound(msg)      { return new ApiError(404, msg || 'Not found'); }
  static conflict(msg)      { return new ApiError(409, msg); }
  static internal(msg)      { return new ApiError(500, msg || 'Internal server error'); }
}

module.exports = ApiError;
