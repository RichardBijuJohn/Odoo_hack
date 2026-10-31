/**
 * Authentication & Authorization Middleware
 *
 * NOTE FOR HACKATHON COLLABORATION:
 * This middleware is modular and decoupled from route business logic.
 *
 * When Team Member 1 completes the production authentication system in `/api/auth`,
 * that system can populate `req.user` (e.g., via JWT or session verification).
 *
 * TEMPORARY DEVELOPMENT / TESTING MECHANISM:
 * For testing before the centralized auth provider is wired up,
 * this middleware also parses incoming `x-user-role`, `x-user-id`, and `x-customer-id`
 * headers (or an Authorization header).
 * DO NOT rely on these headers as a secure production authentication mechanism!
 */

/**
 * Extracts and sets user context on `req.user`.
 * Checks for already-set `req.user` first, then falls back to dev headers.
 */
const authenticate = (req, res, next) => {
  // If production auth already attached a user, keep it
  if (req.user) {
    return next();
  }

  // Temporary development/testing fallback:
  // Allows testing roles and IDOR protections using headers
  const roleHeader = req.headers['x-user-role'];
  const userIdHeader = req.headers['x-user-id'];
  const customerIdHeader = req.headers['x-customer-id'];

  if (roleHeader) {
    const role = String(roleHeader).toLowerCase().trim();
    req.user = {
      id: userIdHeader ? parseInt(userIdHeader, 10) : null,
      role: role, // 'admin', 'staff', 'customer', etc.
      customerId: customerIdHeader ? parseInt(customerIdHeader, 10) : null
    };
  }

  next();
};

/**
 * Middleware ensuring caller is authenticated.
 */
const requireAuth = (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide valid credentials.'
    });
  }
  next();
};

/**
 * Middleware restricting access to internal staff or admin roles.
 */
const requireStaffOrAdmin = (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  const allowedRoles = ['admin', 'staff', 'finance', 'support'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff or admin privileges required.'
    });
  }

  next();
};

module.exports = {
  authenticate,
  requireAuth,
  requireStaffOrAdmin
};

