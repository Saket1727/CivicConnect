const prisma = require('../config/prisma');
const { apiSuccess, apiError } = require('../utils/response');

/**
 * Helper to generate human-readable appointment number
 */
function generateAppointmentNo() {
  const random = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `APT-${year}-${random}`;
}

/**
 * POST /api/v1/appointments/book
 * Citizen books an appointment. Starts as PENDING.
 */
exports.bookAppointment = async (req, res, next) => {
  try {
    const { hospitalId, doctorId, appointmentDate, timeSlot, symptoms } = req.body;

    if (!hospitalId || !doctorId || !appointmentDate || !timeSlot) {
      return apiError(res, 'Hospital, Doctor, Date, and Time Slot are required.', 400);
    }

    const targetDate = new Date(appointmentDate);
    if (isNaN(targetDate.getTime())) {
      return apiError(res, 'Invalid appointment date format.', 400);
    }

    // Verify hospital is verified
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) {
      return apiError(res, 'Hospital not found.', 404);
    }
    if (hospital.status !== 'VERIFIED') {
      return apiError(res, 'Appointments can only be booked at verified hospitals.', 400);
    }

    // Check doctor belongs to hospital
    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, hospitalId },
      include: { user: { select: { name: true } } },
    });
    if (!doctor) {
      return apiError(res, 'Doctor does not belong to the selected hospital.', 400);
    }

    // Database transaction to prevent race conditions and duplicate slot allocation
    const appointment = await prisma.$transaction(async (tx) => {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Check for conflict
      const conflict = await tx.appointment.findFirst({
        where: {
          doctorId,
          appointmentDate: { gte: startOfDay, lte: endOfDay },
          timeSlot,
          status: { in: ['PENDING', 'ACCEPTED'] },
        },
      });

      if (conflict) {
        throw new Error('This time slot is already allocated. Please choose an alternative slot.');
      }

      // Check if this patient already has a pending/accepted booking with this doctor on the same date
      const patientDuplicate = await tx.appointment.findFirst({
        where: {
          patientUserId: req.user.id,
          doctorId,
          appointmentDate: { gte: startOfDay, lte: endOfDay },
          status: { in: ['PENDING', 'ACCEPTED'] },
        },
      });

      if (patientDuplicate) {
        throw new Error('You already have an active appointment scheduled with this doctor on this date.');
      }

      const apptNo = generateAppointmentNo();

      return await tx.appointment.create({
        data: {
          appointmentNo: apptNo,
          patientUserId: req.user.id,
          doctorId,
          hospitalId,
          appointmentDate: targetDate,
          timeSlot,
          status: 'PENDING', // CRITICAL WORKFLOW: starts as PENDING until hospital review
          symptoms,
        },
        include: {
          hospital: { select: { id: true, name: true, phone: true } },
          doctor: {
            include: {
              user: { select: { name: true } },
              department: { select: { name: true } },
            },
          },
        },
      });
    });

    return apiSuccess(
      res,
      appointment,
      'Appointment request submitted successfully. It is currently in PENDING review with hospital staff.',
      201
    );
  } catch (error) {
    if (error.message.includes('already allocated') || error.message.includes('already have an active')) {
      return apiError(res, error.message, 409);
    }
    next(error);
  }
};

/**
 * GET /api/v1/appointments/my
 * Citizen view of their appointments
 */
exports.getMyPatientAppointments = async (req, res, next) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patientUserId: req.user.id },
      include: {
        hospital: { select: { id: true, name: true, address: true, phone: true } },
        doctor: {
          include: {
            user: { select: { name: true, phone: true } },
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { appointmentDate: 'desc' },
    });

    return apiSuccess(res, appointments, 'Appointments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/appointments/hospital
 * Hospital Admin & Doctor view of appointments
 */
exports.getHospitalAppointments = async (req, res, next) => {
  try {
    const { status, date, doctorId } = req.query;

    const where = {};

    // RBAC Scope Filtering
    if (req.user.role === 'DOCTOR') {
      const doc = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
      if (!doc) return apiError(res, 'Doctor profile not found.', 404);
      where.doctorId = doc.id;
    } else if (req.user.role === 'HOSPITAL_ADMIN') {
      const hospital = await prisma.hospital.findFirst({ where: { adminUserId: req.user.id } });
      if (!hospital) return apiError(res, 'No hospital assigned to this administrator account.', 404);
      where.hospitalId = hospital.id;
    } else if (req.user.role !== 'SUPER_ADMIN') {
      return apiError(res, 'Unauthorized access to hospital appointments.', 403);
    }

    if (doctorId && req.user.role !== 'DOCTOR') {
      where.doctorId = doctorId;
    }

    if (status && ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      where.status = status;
    }

    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);
      where.appointmentDate = { gte: startOfDay, lte: endOfDay };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patientUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            patientProfile: true,
          },
        },
        doctor: {
          include: {
            user: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
        actionByUser: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(res, appointments, 'Hospital appointments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/appointments/:id/status
 * Review appointment: ACCEPT, REJECT, CANCEL, COMPLETED
 */
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return apiError(res, 'Invalid appointment status transition.', 400);
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { hospital: true, doctor: true },
    });

    if (!appointment) {
      return apiError(res, 'Appointment not found.', 404);
    }

    // Authorization checks
    if (status === 'CANCELLED') {
      // Citizen cancelling own appointment
      if (req.user.id !== appointment.patientUserId && req.user.role !== 'SUPER_ADMIN') {
        return apiError(res, 'Only the patient can cancel their appointment request.', 403);
      }
    } else {
      // ACCEPT / REJECT / COMPLETED requires Doctor or Hospital Admin
      if (req.user.role === 'DOCTOR') {
        const doc = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
        if (!doc || doc.id !== appointment.doctorId) {
          return apiError(res, 'You can only review appointments assigned to you.', 403);
        }
      } else if (req.user.role === 'HOSPITAL_ADMIN') {
        if (appointment.hospital.adminUserId !== req.user.id) {
          return apiError(res, 'You can only review appointments for your own hospital.', 403);
        }
      } else if (req.user.role !== 'SUPER_ADMIN') {
        return apiError(res, 'Unauthorized action on appointment.', 403);
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
        actionByUserId: req.user.id,
        updatedAt: new Date(),
      },
      include: {
        patientUser: { select: { name: true, email: true, phone: true } },
        doctor: { include: { user: { select: { name: true } } } },
      },
    });

    return apiSuccess(res, updated, `Appointment request marked as ${status}`);
  } catch (error) {
    next(error);
  }
};
