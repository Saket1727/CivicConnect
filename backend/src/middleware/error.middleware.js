const { apiError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Error:', err);

  if (err.name === 'ZodError') {
    const errorDetails = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return apiError(res, 'Validation Error', 400, errorDetails);
  }

  if (err.code === 'P2002') {
    return apiError(res, `A duplicate record already exists for field: ${err.meta?.target || 'unique field'}`, 409);
  }

  if (err.code === 'P2025') {
    return apiError(res, 'Record not found in database.', 404);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred on the server.';
  return apiError(res, message, statusCode);
};

module.exports = errorHandler;
