const express = require('express');
const router = express.Router();
const bloodBankController = require('../controllers/bloodBank.controller');
const { authenticateToken, requireRoles } = require('../middleware/auth.middleware');
const { logAudit } = require('../middleware/audit.middleware');

router.get('/', bloodBankController.getBloodBanks);

router.put(
  '/:id/inventory',
  authenticateToken,
  requireRoles('BLOOD_BANK_ADMIN', 'SUPER_ADMIN'),
  logAudit('UPDATE_BLOOD_INVENTORY', 'BloodInventory'),
  bloodBankController.updateBloodInventory
);

module.exports = router;
