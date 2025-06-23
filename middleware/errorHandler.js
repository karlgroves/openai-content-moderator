// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Default error response
  const errorResponse = {
    error: "Internal server error",
    message: err.message || "An unexpected error occurred"
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Set appropriate status code
  const statusCode = err.statusCode || err.status || 500;
  
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper to catch errors in async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler
};