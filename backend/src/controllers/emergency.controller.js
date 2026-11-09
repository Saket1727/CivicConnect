const prisma = require('../config/prisma');
const { apiSuccess, apiError } = require('../utils/response');

function generateEmergencyNo() {
  const rand = Math.floor(100 + Math.random() * 900);
  return `EMG-${new Date().getFullYear()}-${rand}`;
}

/**
 * POST /api/v1/emergency/register
 * Urgent Emergency OPD Registration
 */
exports.registerEmergency = async (req, res, next) => {
  try {
    const {
      patientName,
      patientPhone,
      age,
      emergencyType,
      triagePriority = 'HIGH',
      description,
      hospitalId,
      emergencyContactName,
      emergencyContactPhone,
      latitude,
      longitude,
    } = req.body;

    if (!patientName || !patientPhone || !emergencyType || !hospitalId) {
      return apiError(res, 'Patient name, phone number, emergency type, and hospital are required.', 400);
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { id: true, name: true, emergencyPhone: true, phone: true },
    });

    if (!hospital) {
      return apiError(res, 'Selected hospital not found.', 404);
    }

    const emergency = await prisma.emergencyRegistration.create({
      data: {
        emergencyNo: generateEmergencyNo(),
        patientName,
        patientPhone,
        age: age ? parseInt(age, 10) : undefined,
        emergencyType,
        triagePriority,
        description,
        hospitalId,
        emergencyContactName,
        emergencyContactPhone,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        status: 'REPORTED',
      },
      include: {
        hospital: { select: { name: true, address: true, emergencyPhone: true, phone: true } },
      },
    });

    return apiSuccess(
      res,
      emergency,
      'Emergency registration logged in hospital triage system. In life-threatening emergencies, also dial 108 immediately.',
      201,
      {
        safetyNotice: 'EMERGENCY ADVISORY: This digital registration alerts the trauma desk, but does NOT replace active paramedic transit. If patient is unresponsive or severely unstable, call National Emergency 108 / 112 without delay.',
        hospitalHotline: hospital.emergencyPhone || hospital.phone,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/emergency/queue
 * Hospital emergency triage queue
 */
exports.getEmergencyQueue = async (req, res, next) => {
  try {
    const { status, priority, hospitalId } = req.query;

    const where = {};

    if (req.user.role === 'HOSPITAL_ADMIN') {
      const hospital = await prisma.hospital.findFirst({ where: { adminUserId: req.user.id } });
      if (!hospital) return apiError(res, 'No hospital assigned.', 404);
      where.hospitalId = hospital.id;
    } else if (req.user.role === 'DOCTOR') {
      const doc = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
      if (!doc) return apiError(res, 'Doctor profile not found.', 404);
      where.hospitalId = doc.hospitalId;
    } else if (hospitalId && req.user.role === 'SUPER_ADMIN') {
      where.hospitalId = hospitalId;
    }

    if (status) where.status = status;
    if (priority) where.triagePriority = priority;

    const queue = await prisma.emergencyRegistration.findMany({
      where,
      include: {
        hospital: { select: { id: true, name: true } },
      },
      orderBy: [
        { triagePriority: 'asc' }, // CRITICAL before HIGH before MEDIUM
        { createdAt: 'desc' },
      ],
    });

    return apiSuccess(res, queue, 'Emergency triage queue retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/emergency/:id/status
 */
exports.updateEmergencyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, triagePriority } = req.body;

    if (!['REPORTED', 'TRIAGED', 'ADMITTED', 'DISCHARGED'].includes(status)) {
      return apiError(res, 'Invalid emergency triage status.', 400);
    }

    const updated = await prisma.emergencyRegistration.update({
      where: { id },
      data: {
        status,
        triagePriority: triagePriority || undefined,
        updatedAt: new Date(),
      },
    });

    return apiSuccess(res, updated, `Emergency record marked as ${status}`);
  } catch (error) {
    next(error);
  }
};
