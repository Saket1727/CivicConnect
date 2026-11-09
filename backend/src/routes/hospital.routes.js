const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospital.controller');
const { authenticateToken, requireRoles } = require('../middleware/auth.middleware');
const { logAudit } = require('../middleware/audit.middleware');

// Public endpoints
router.get('/', hospitalController.getHospitals);
router.get('/:id', hospitalController.getHospitalById);
router.get('/:id/beds', hospitalController.getHospitalBeds);

// Hospital onboarding
router.post(
  '/register',
  authenticateToken,
  requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'),
  logAudit('REGISTER_HOSPITAL', 'Hospital'),
  hospitalController.registerHospital
);

// Bed updates
router.put(
  ('/:id/beds'),
  authenticateToken,
  requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'),
  logAudit('UPDATE_BEDS', 'HospitalBed'),
  hospitalController.updateHospitalBeds
);

module.exports = router;
