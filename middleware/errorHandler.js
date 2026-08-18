// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log an explicit, allowlisted shape rather than the raw error object, which
  // may carry an unbounded `cause` chain from a third-party client. The stack is
  // kept because it is ours and is the useful part for debugging.
  console.error('Error:', {
    name: err?.name,
    message: err?.message,
    statusCode: err?.statusCode ?? err?.status,
    code: err?.code,
    stack: err?.stack,
  });

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
