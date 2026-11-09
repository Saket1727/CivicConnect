const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { authenticateToken, requireRoles } = require('../middleware/auth.middleware');
const { logAudit } = require('../middleware/audit.middleware');

router.get('/', doctorController.getDoctors);
router.get('/:id', doctorController.getDoctorById);
router.get('/:id/slots', doctorController.getAvailableSlots);

router.post(
  '/',
  authenticateToken,
  requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'),
  logAudit('CREATE_DOCTOR', 'Doctor'),
  doctorController.createDoctor
);

module.exports = router;
