/**
 * Middleware to restrict route access to specific Admin roles
 * @param  {...string} allowedRoles (e.g. 'SUPER_ADMIN', 'SUPPORT_LEAD', etc.)
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required.' }
      });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Your role: ${req.admin.role}`
        }
      });
    }

    next();
  };
}
