/**
 * Standardized API Response Helpers
 */
const apiSuccess = (res, data = null, message = 'Success', statusCode = 200, meta = undefined) => {
  const response = {
    success: true,
    message,
    data,
  };
  if (meta !== undefined) {
    response.meta = meta;
  }
  return res.status(statusCode).json(response);
};

const apiError = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};

module.exports = {
  apiSuccess,
  apiError,
};
