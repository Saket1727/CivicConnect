const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { authenticateToken, requireRoles } = require('../middleware/auth.middleware');
const { logAudit } = require('../middleware/audit.middleware');

// Citizen bookings
router.post(
  '/book',
  authenticateToken,
  logAudit('BOOK_APPOINTMENT', 'Appointment'),
  appointmentController.bookAppointment
);

router.get(
  '/my',
  authenticateToken,
  appointmentController.getMyPatientAppointments
);

// Hospital Staff / Doctor / Admin management
router.get(
  '/hospital',
  authenticateToken,
  requireRoles('HOSPITAL_ADMIN', 'DOCTOR', 'SUPER_ADMIN'),
  appointmentController.getHospitalAppointments
);

router.put(
  '/:id/status',
  authenticateToken,
  logAudit('UPDATE_APPOINTMENT_STATUS', 'Appointment'),
  appointmentController.updateAppointmentStatus
);

module.exports = router;
