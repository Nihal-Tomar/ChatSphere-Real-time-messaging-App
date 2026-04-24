import jwt from 'jsonwebtoken';

const JWT_SECRET = () => process.env.JWT_SECRET;
const JWT_EXPIRES_IN = () => process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT access token
 */
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET(), {
    expiresIn: JWT_EXPIRES_IN(),
  });
};

/**
 * Generate a longer-lived refresh token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET(), {
    expiresIn: '30d',
  });
};

/**
 * Verify and decode a JWT
 */
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET());
};
