import { validationResult } from 'express-validator';
import ApiError from '../utils/apiError.js';

/**
 * Runs after express-validator chains and aborts request if errors exist
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(', ');
    return next(new ApiError(message, 422));
  }
  next();
};
