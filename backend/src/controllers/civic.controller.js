const prisma = require('../config/prisma');
const { apiSuccess, apiError } = require('../utils/response');

/**
 * POST /api/v1/complaints
 */
exports.createComplaint = async (req, res, next) => {
  try {
    const { category, title, description, locationAddress, latitude, longitude, imageUrl } = req.body;

    if (!title || !description || !locationAddress) {
      return apiError(res, 'Title, description, and location address are required.', 400);
    }

    const complaint = await prisma.civicComplaint.create({
      data: {
        citizenUserId: req.user.id,
        category: category || 'OTHER',
        title,
        description,
        locationAddress,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        imageUrl,
        status: 'PENDING',
      },
    });

    return apiSuccess(res, complaint, 'Civic complaint submitted to municipal authorities.', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/complaints
 */
exports.getComplaints = async (req, res, next) => {
  try {
    const { status, category } = req.query;

    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;

    // If regular citizen, restrict to own complaints
    if (req.user.role === 'CITIZEN') {
      where.citizenUserId = req.user.id;
    }

    const complaints = await prisma.civicComplaint.findMany({
      where,
      include: {
        citizenUser: { select: { id: true, name: true, phone: true } },
        assignedAuthority: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(res, complaints, 'Civic complaints retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/complaints/:id/status
 * Municipal Authority updates complaint status
 */
exports.updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    if (!['PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
      return apiError(res, 'Invalid complaint status.', 400);
    }

    if (!['AUTHORITY', 'SUPER_ADMIN'].includes(req.user.role)) {
      return apiError(res, 'Only municipal authorities can action civic complaints.', 403);
    }

    const updated = await prisma.civicComplaint.update({
      where: { id },
      data: {
        status,
        resolutionNotes,
        assignedAuthorityId: req.user.id,
        updatedAt: new Date(),
      },
      include: {
        citizenUser: { select: { name: true, email: true } },
      },
    });

    return apiSuccess(res, updated, `Complaint status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};
