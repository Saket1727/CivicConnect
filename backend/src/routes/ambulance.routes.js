const express = require('express');
const router = express.Router();
const ambulanceController = require('../controllers/ambulance.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { logAudit } = require('../middleware/audit.middleware');

router.post(
  '/request',
  authenticateToken,
  logAudit('AMBULANCE_REQUEST', 'AmbulanceRequest'),
  ambulanceController.requestAmbulance
);

router.get(
  '/requests',
  authenticateToken,
  ambulanceController.getAmbulanceRequests
);

router.put(
  '/requests/:id/status',
  authenticateToken,
  logAudit('UPDATE_AMBULANCE_STATUS', 'AmbulanceRequest'),
  ambulanceController.updateAmbulanceStatus
);

module.exports = router;
