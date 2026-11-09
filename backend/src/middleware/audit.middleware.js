const prisma = require('../config/prisma');

const logAudit = (action, entity) => {
  return async (req, res, next) => {
    // Intercept finish to record log after successful action
    const originalJson = res.json;
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user ? req.user.id : null;
        const entityId = req.params?.id || body?.data?.id || null;
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;

        prisma.auditLog.create({
          data: {
            userId,
            action,
            entity,
            entityId: entityId ? String(entityId) : null,
            details: JSON.stringify({
              method: req.method,
              path: req.originalUrl,
              body: req.method !== 'GET' ? req.body : undefined,
            }),
            ipAddress,
          },
        }).catch(err => {
          console.error('Audit log creation failed:', err.message);
        });
      }
      return originalJson.call(this, body);
    };
    next();
  };
};

module.exports = { logAudit };
