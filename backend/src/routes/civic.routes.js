const express = require('express');
const router = express.Router();
const civicController = require('../controllers/civic.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { logAudit } = require('../middleware/audit.middleware');

router.post(
  '/',
  authenticateToken,
  logAudit('CREATE_CIVIC_COMPLAINT', 'CivicComplaint'),
  civicController.createComplaint
);

router.get(
  '/',
  authenticateToken,
  civicController.getComplaints
);

router.put(
  '/:id/status',
  authenticateToken,
  logAudit('UPDATE_COMPLAINT_STATUS', 'CivicComplaint'),
  civicController.updateComplaintStatus
);

module.exports = router;
