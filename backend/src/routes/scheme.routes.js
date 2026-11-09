const express = require('express');
const router = express.Router();
const schemeController = require('../controllers/scheme.controller');
const { authenticateToken, requireRoles } = require('../middleware/auth.middleware');
const { logAudit } = require('../middleware/audit.middleware');

router.get('/', schemeController.getSchemes);

router.post(
  '/',
  authenticateToken,
  requireRoles('SUPER_ADMIN'),
  logAudit('CREATE_WELFARE_SCHEME', 'WelfareScheme'),
  schemeController.createScheme
);

module.exports = router;
