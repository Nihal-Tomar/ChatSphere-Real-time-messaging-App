/**
 * Standardised API success response helper
 */
export const apiResponse = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export default apiResponse;
