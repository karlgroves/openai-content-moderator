// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Set appropriate status code
  const statusCode = err.statusCode || err.status || 500;

  // Never expose internal error details to clients
  const errorResponse = {
    error: statusCode === 500 ? 'Internal server error' : err.message || 'An error occurred',
  };

  // Only add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper to catch errors in async route handlers
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler,
};
