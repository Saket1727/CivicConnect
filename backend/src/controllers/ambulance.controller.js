const prisma = require('../config/prisma');
const { apiSuccess, apiError } = require('../utils/response');

function generateRequestNo() {
  const rand = Math.floor(100 + Math.random() * 900);
  return `AMB-${new Date().getFullYear()}-${rand}`;
}

/**
 * POST /api/v1/ambulances/request
 * Citizen requests urgent ambulance transit
 */
exports.requestAmbulance = async (req, res, next) => {
  try {
    const {
      patientName,
      patientPhone,
      pickupAddress,
      pickupLat,
      pickupLng,
      destinationHospitalId,
      emergencyDetails,
    } = req.body;

    if (!patientName || !patientPhone || !pickupAddress || pickupLat === undefined || pickupLng === undefined) {
      return apiError(res, 'Patient name, phone, pickup address, and coordinates are required.', 400);
    }

    const request = await prisma.ambulanceRequest.create({
      data: {
        requestNo: generateRequestNo(),
        citizenUserId: req.user.id,
        patientName,
        patientPhone,
        pickupAddress,
        pickupLat: parseFloat(pickupLat),
        pickupLng: parseFloat(pickupLng),
        destinationHospitalId,
        emergencyDetails,
        status: 'REQUESTED',
      },
      include: {
        destinationHospital: { select: { id: true, name: true, phone: true } },
      },
    });

    return apiSuccess(
      res,
      request,
      'Ambulance assistance request broadcasted to nearest mobile units.',
      201,
      {
        safetyNotice: 'For immediate life-support dispatch, you can also dial 108 directly.',
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/ambulances/requests
 */
exports.getAmbulanceRequests = async (req, res, next) => {
  try {
    const isProvider = req.user.role === 'AMBULANCE_PROVIDER' || req.user.role === 'SUPER_ADMIN';

    const where = {};
    if (!isProvider) {
      // Citizen viewing their own requests
      where.citizenUserId = req.user.id;
    }

    const requests = await prisma.ambulanceRequest.findMany({
      where,
      include: {
        destinationHospital: { select: { id: true, name: true, phone: true } },
        provider: {
          include: {
            user: { select: { name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // PRIVACY ENFORCEMENT:
    // Mask patient telephone number until request is ACCEPTED by the provider
    const sanitized = requests.map(r => {
      const isOwner = r.citizenUserId === req.user.id;
      const isAssigned = r.provider?.userId === req.user.id;
      const canViewContact = isOwner || isAssigned || req.user.role === 'SUPER_ADMIN';

      return {
        ...r,
        patientPhone: canViewContact
          ? r.patientPhone
          : `${r.patientPhone.slice(0, 3)}****${r.patientPhone.slice(-3)}`,
      };
    });

    return apiSuccess(res, sanitized, 'Ambulance requests retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/ambulances/requests/:id/status
 * State machine: REQUESTED -> ACCEPTED -> DISPATCHED -> COMPLETED
 */
exports.updateAmbulanceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['ACCEPTED', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];
    if (!allowed.includes(status)) {
      return apiError(res, 'Invalid ambulance request status transition.', 400);
    }

    const existing = await prisma.ambulanceRequest.findUnique({
      where: { id },
      include: { provider: true },
    });

    if (!existing) {
      return apiError(res, 'Ambulance request not found.', 404);
    }

    // Role checks
    let providerIdToSet = existing.providerId;

    if (status === 'CANCELLED') {
      if (req.user.id !== existing.citizenUserId && req.user.role !== 'SUPER_ADMIN') {
        return apiError(res, 'Only the citizen who created the request can cancel it.', 403);
      }
    } else {
      // Must be an ambulance provider or super admin
      if (req.user.role !== 'AMBULANCE_PROVIDER' && req.user.role !== 'SUPER_ADMIN') {
        return apiError(res, 'Only certified ambulance providers can accept and dispatch requests.', 403);
      }

      if (status === 'ACCEPTED') {
        const provider = await prisma.ambulanceProvider.findUnique({ where: { userId: req.user.id } });
        if (!provider && req.user.role !== 'SUPER_ADMIN') {
          return apiError(res, 'No registered ambulance vehicle profile found for this user.', 400);
        }
        providerIdToSet = provider ? provider.id : existing.providerId;
      }
    }

    const updated = await prisma.ambulanceRequest.update({
      where: { id },
      data: {
        status,
        providerId: providerIdToSet,
        updatedAt: new Date(),
      },
      include: {
        destinationHospital: true,
        provider: { include: { user: { select: { name: true, phone: true } } } },
      },
    });

    return apiSuccess(res, updated, `Ambulance request status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};
