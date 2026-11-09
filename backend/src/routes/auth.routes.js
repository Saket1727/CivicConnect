const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { logAudit } = require('../middleware/audit.middleware');

router.post('/register', authController.register);
router.post('/login', logAudit('USER_LOGIN', 'User'), authController.login);
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, logAudit('UPDATE_PROFILE', 'User'), authController.updateProfile);

module.exports = router;
