const db = require('../database');

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (req.user.role === 'admin') {
      return next();
    }

    const permsQuery = db.prepare('SELECT * FROM permissions WHERE user_id = ?');
    const perms = permsQuery.get(req.user.id);

    if (!perms || !perms[requiredPermission]) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = checkPermission;
