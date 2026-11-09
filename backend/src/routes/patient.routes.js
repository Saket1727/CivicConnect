const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const { authenticateToken, requireRoles } = require('../middleware/auth.middleware');
const { logAudit } = require('../middleware/audit.middleware');

// Citizen patient views their own record
router.get('/me', authenticateToken, patientController.getMyMedicalProfile);

// Clinical staff views patient record
router.get(
  '/:id/records',
  authenticateToken,
  requireRoles('DOCTOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'),
  logAudit('VIEW_CLINICAL_RECORDS', 'PatientMedicalRecord'),
  patientController.getPatientClinicalRecords
);

// Doctor creates clinical encounter and prescriptions
router.post(
  '/:id/records',
  authenticateToken,
  requireRoles('DOCTOR', 'SUPER_ADMIN'),
  logAudit('CREATE_CLINICAL_RECORD', 'PatientMedicalRecord'),
  patientController.createClinicalRecord
);

module.exports = router;
