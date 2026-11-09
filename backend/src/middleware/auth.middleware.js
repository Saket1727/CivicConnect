const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { apiError } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'civicconnect_super_secure_jwt_secret_key_2026';

/**
 * Verifies JWT token and attaches user info to req.user
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return apiError(res, 'Access denied. No authentication token provided.', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is active in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return apiError(res, 'User account is inactive or no longer exists.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return apiError(res, 'Authentication token has expired. Please log in again.', 401);
    }
    return apiError(res, 'Invalid authentication token.', 401);
  }
};

/**
 * Role-Based Access Control (RBAC) middleware
 * Allows specified roles. SUPER_ADMIN is always allowed.
 */
const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return apiError(res, 'Unauthorized. Please log in.', 401);
    }

    if (req.user.role === 'SUPER_ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return apiError(
      res,
      `Forbidden: This action requires one of the following roles: [${allowedRoles.join(', ')}]`,
      403
    );
  };
};

module.exports = {
  authenticateToken,
  requireRoles,
};
