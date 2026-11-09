const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacy.controller');
const { authenticateToken, requireRoles } = require('../middleware/auth.middleware');
const { logAudit } = require('../middleware/audit.middleware');

router.get('/medicines', pharmacyController.getMedicines);
router.get('/', pharmacyController.getPharmacies);

router.post(
  '/:id/inventory',
  authenticateToken,
  requireRoles('PHARMACY_ADMIN', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'),
  logAudit('UPDATE_PHARMACY_INVENTORY', 'PharmacyInventory'),
  pharmacyController.updateInventory
);

module.exports = router;
