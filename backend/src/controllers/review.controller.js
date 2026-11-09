const prisma = require('../config/prisma');
const { apiSuccess, apiError } = require('../utils/response');

/**
 * POST /api/v1/reviews
 */
exports.createReview = async (req, res, next) => {
  try {
    const { hospitalId, rating, comment } = req.body;

    if (!hospitalId || !rating) {
      return apiError(res, 'Hospital ID and rating (1-5) are required.', 400);
    }

    const numericRating = parseInt(rating, 10);
    if (numericRating < 1 || numericRating > 5) {
      return apiError(res, 'Rating must be between 1 and 5.', 400);
    }

    // Check duplicate review
    const existing = await prisma.hospitalReview.findUnique({
      where: {
        hospitalId_userId: {
          hospitalId,
          userId: req.user.id,
        },
      },
    });

    if (existing) {
      return apiError(res, 'You have already submitted a review for this hospital.', 409);
    }

    // Check if user had an appointment at this hospital
    const pastVisit = await prisma.appointment.findFirst({
      where: {
        hospitalId,
        patientUserId: req.user.id,
        status: { in: ['ACCEPTED', 'COMPLETED'] },
      },
    });

    const review = await prisma.hospitalReview.create({
      data: {
        hospitalId,
        userId: req.user.id,
        rating: numericRating,
        comment,
        isVerifiedVisit: Boolean(pastVisit),
      },
      include: {
        user: { select: { name: true } },
      },
    });

    return apiSuccess(res, review, 'Hospital feedback submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reviews/:hospitalId
 */
exports.getHospitalReviews = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;

    const reviews = await prisma.hospitalReview.findMany({
      where: { hospitalId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = reviews.length;
    const avgRating = total > 0
      ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1))
      : 4.5;

    return apiSuccess(res, {
      hospitalId,
      averageRating: avgRating,
      totalReviews: total,
      reviews,
    }, 'Reviews retrieved');
  } catch (error) {
    next(error);
  }
};
