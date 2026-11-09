const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergency.controller');
const { authenticateToken, requireRoles } = require('../middleware/auth.middleware');
const { logAudit } = require('../middleware/audit.middleware');

// Public urgent emergency registration
router.post(
  '/register',
  logAudit('EMERGENCY_REGISTRATION', 'EmergencyRegistration'),
  emergencyController.registerEmergency
);

// Hospital Staff / Doctor / Super Admin triage queue
router.get(
  '/queue',
  authenticateToken,
  requireRoles('HOSPITAL_ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
  emergencyController.getEmergencyQueue
);

router.put(
  '/:id/status',
  authenticateToken,
  requireRoles('HOSPITAL_ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
  logAudit('UPDATE_EMERGENCY_STATUS', 'EmergencyRegistration'),
  emergencyController.updateEmergencyStatus
);

module.exports = router;
