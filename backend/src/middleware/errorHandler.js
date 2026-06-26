/**
 * Global error handler — catches ApiError and unexpected errors
 */
const errorHandler = (err, req, res, _next) => {
  const status  = err.statusCode || 500;
  const message = err.message    || 'Internal server error';

  if (process.env.NODE_ENV === 'development' && status === 500) {
    console.error('[ERROR]', err);
  }

  res.status(status).json({
    success: false,
    error:   message,
  });
};

module.exports = errorHandler;
