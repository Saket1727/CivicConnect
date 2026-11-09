const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { logAudit } = require('../middleware/audit.middleware');

router.get('/:hospitalId', reviewController.getHospitalReviews);

router.post(
  '/',
  authenticateToken,
  logAudit('SUBMIT_REVIEW', 'HospitalReview'),
  reviewController.createReview
);

module.exports = router;
