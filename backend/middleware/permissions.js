const db = require('../database');

/**
 * checkPermission middleware
 * Checks if the authenticated user has the given permission flag set to 1 in the database.
 * Admins and super_admins always pass through.
 * Read-only users are blocked from any write operations (non-GET methods).
 */
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    // Admins bypass everything
    if (req.user.role === 'admin') return next();

    const perms = db.prepare('SELECT * FROM permissions WHERE user_id = ?').get(req.user.id);

    // Super admin bypasses all checks
    if (perms && perms.is_super_admin) return next();

    // Read-only users cannot perform write operations
    if (perms && perms.is_read_only && req.method !== 'GET') {
      return res.status(403).json({ message: 'Forbidden: Your account is in read-only mode.' });
    }

    // Check specific permission
    if (!perms || !perms[requiredPermission]) {
      return res.status(403).json({
        message: `Forbidden: You do not have the "${requiredPermission}" permission.`
      });
    }

    next();
  };
};

module.exports = checkPermission;
