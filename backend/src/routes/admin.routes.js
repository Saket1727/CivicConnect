const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateToken, requireRoles } = require('../middleware/auth.middleware');
const { logAudit } = require('../middleware/audit.middleware');

// Super admin platform command center
router.get(
  '/stats',
  authenticateToken,
  requireRoles('SUPER_ADMIN'),
  adminController.getPlatformStats
);

router.get(
  '/verifications',
  authenticateToken,
  requireRoles('SUPER_ADMIN'),
  adminController.getPendingVerifications
);

router.put(
  '/verifications/:id',
  authenticateToken,
  requireRoles('SUPER_ADMIN'),
  logAudit('VERIFY_HOSPITAL', 'Hospital'),
  adminController.verifyHospital
);

router.get(
  '/users',
  authenticateToken,
  requireRoles('SUPER_ADMIN'),
  adminController.getUsers
);

router.get(
  '/logs',
  authenticateToken,
  requireRoles('SUPER_ADMIN'),
  adminController.getAuditLogs
);

// Hospital specific analytics for Hospital Admin and Super Admin
router.get(
  '/hospital-reports/:hospitalId',
  authenticateToken,
  requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'),
  adminController.getHospitalReports
);

module.exports = router;
