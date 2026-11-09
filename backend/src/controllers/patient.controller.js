const prisma = require('../config/prisma');
const { apiSuccess, apiError } = require('../utils/response');

/**
 * GET /api/v1/patients/me
 * Citizen patient looks up their own medical dashboard
 */
exports.getMyMedicalProfile = async (req, res, next) => {
  try {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    const appointments = await prisma.appointment.findMany({
      where: { patientUserId: req.user.id },
      include: {
        hospital: { select: { name: true, city: true } },
        doctor: { include: { user: { select: { name: true } }, department: { select: { name: true } } } },
      },
      orderBy: { appointmentDate: 'desc' },
      take: 10,
    });

    const medicalRecords = await prisma.patientMedicalRecord.findMany({
      where: { patientUserId: req.user.id },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        hospital: { select: { name: true } },
        prescriptions: {
          include: { items: true },
        },
      },
      orderBy: { visitDate: 'desc' },
    });

    const prescriptions = await prisma.prescription.findMany({
      where: { patientUserId: req.user.id },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(res, {
      profile,
      appointments,
      medicalRecords,
      prescriptions,
    }, 'Patient medical profile retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/patients/:id/records
 * Doctor / Hospital Staff views patient medical records
 */
exports.getPatientClinicalRecords = async (req, res, next) => {
  try {
    const { id } = req.params; // patientUserId

    // RBAC: Only authorized Doctor, Hospital Admin, or Super Admin can inspect records
    if (!['DOCTOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      if (req.user.id !== id) {
        return apiError(res, 'Access denied. You can only view your own medical records.', 403);
      }
    }

    const patient = await prisma.user.findUnique({
      where: { id },
      include: { patientProfile: true },
    });

    if (!patient) {
      return apiError(res, 'Patient record not found.', 404);
    }

    const records = await prisma.patientMedicalRecord.findMany({
      where: { patientUserId: id },
      include: {
        doctor: { include: { user: { select: { name: true } }, department: { select: { name: true } } } },
        hospital: { select: { name: true } },
        prescriptions: { include: { items: true } },
      },
      orderBy: { visitDate: 'desc' },
    });

    return apiSuccess(res, { patient, records }, 'Patient records retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/patients/:id/records
 * Doctor creates clinical encounter and prescriptions
 */
exports.createClinicalRecord = async (req, res, next) => {
  try {
    const { id } = req.params; // patientUserId
    const { diagnosis, clinicalNotes, followUpDate, prescriptionNotes, prescriptionItems } = req.body;

    if (!diagnosis) {
      return apiError(res, 'Clinical diagnosis is required.', 400);
    }

    // Verify requesting user is a doctor
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id },
    });

    if (!doctor && req.user.role !== 'SUPER_ADMIN') {
      return apiError(res, 'Only licensed medical doctors can create clinical records.', 403);
    }

    const doctorId = doctor ? doctor.id : (await prisma.doctor.findFirst()).id;
    const hospitalId = doctor ? doctor.hospitalId : (await prisma.hospital.findFirst()).id;

    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.patientMedicalRecord.create({
        data: {
          patientUserId: id,
          doctorId,
          hospitalId,
          diagnosis,
          clinicalNotes,
          followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        },
      });

      if (prescriptionItems && Array.isArray(prescriptionItems) && prescriptionItems.length > 0) {
        const presc = await tx.prescription.create({
          data: {
            medicalRecordId: record.id,
            doctorId,
            patientUserId: id,
            notes: prescriptionNotes,
          },
        });

        for (const item of prescriptionItems) {
          if (item.medicineName) {
            await tx.prescriptionItem.create({
              data: {
                prescriptionId: presc.id,
                medicineName: item.medicineName,
                dosage: item.dosage || 'Standard dosage',
                frequency: item.frequency || '1-0-1',
                durationDays: parseInt(item.durationDays || 5, 10),
                instructions: item.instructions || 'After food',
              },
            });
          }
        }
      }

      return record;
    });

    return apiSuccess(res, result, 'Clinical record and prescription recorded successfully', 201);
  } catch (error) {
    next(error);
  }
};
