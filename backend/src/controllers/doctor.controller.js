const prisma = require('../config/prisma');
const { apiSuccess, apiError } = require('../utils/response');

/**
 * GET /api/v1/doctors
 */
exports.getDoctors = async (req, res, next) => {
  try {
    const { hospitalId, departmentId, specialization, search } = req.query;

    const where = {};
    if (hospitalId) where.hospitalId = hospitalId;
    if (departmentId) where.departmentId = departmentId;
    if (specialization) where.specialization = { contains: specialization };
    if (search) {
      where.OR = [
        { specialization: { contains: search } },
        { qualification: { contains: search } },
        { user: { name: { contains: search } } },
      ];
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        hospital: { select: { id: true, name: true, city: true } },
        department: { select: { id: true, name: true } },
        schedules: true,
      },
      orderBy: { experienceYears: 'desc' },
    });

    return apiSuccess(res, doctors, 'Doctors retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/doctors/:id
 */
exports.getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        hospital: true,
        department: true,
        schedules: { orderBy: { dayOfWeek: 'asc' } },
        unavailableDates: true,
      },
    });

    if (!doctor) {
      return apiError(res, 'Doctor not found.', 404);
    }

    return apiSuccess(res, doctor, 'Doctor retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/doctors/:id/slots?date=YYYY-MM-DD
 * Real-time slot availability calculator
 */
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return apiError(res, 'Query parameter "date" (YYYY-MM-DD) is required.', 400);
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return apiError(res, 'Invalid date format. Use YYYY-MM-DD.', 400);
    }

    const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon...

    // 1. Check doctor leave / unavailability
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const onLeave = await prisma.doctorUnavailableDate.findFirst({
      where: {
        doctorId: id,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (onLeave) {
      return apiSuccess(res, {
        date,
        isDoctorAvailable: false,
        reason: onLeave.reason || 'Doctor is on scheduled leave',
        slots: [],
      });
    }

    // 2. Find schedule for this day of week
    const schedule = await prisma.doctorSchedule.findUnique({
      where: {
        doctorId_dayOfWeek: {
          doctorId: id,
          dayOfWeek,
        },
      },
    });

    if (!schedule) {
      return apiSuccess(res, {
        date,
        isDoctorAvailable: false,
        reason: 'No OPD schedule configured for this day of week.',
        slots: [],
      });
    }

    // 3. Generate slots
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);
    const duration = schedule.slotDurationMins || 15;

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const allGeneratedSlots = [];

    while (currentMinutes + duration <= endMinutes) {
      const h = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
      const m = (currentMinutes % 60).toString().padStart(2, '0');
      allGeneratedSlots.push(`${h}:${m}`);
      currentMinutes += duration;
    }

    // 4. Fetch existing booked appointments for that doctor on that date
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: id,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
      select: { timeSlot: true, status: true },
    });

    const bookedSlotSet = new Set(bookedAppointments.map(a => a.timeSlot));

    const slotObjects = allGeneratedSlots.map(slot => ({
      time: slot,
      isAvailable: !bookedSlotSet.has(slot),
      status: bookedSlotSet.has(slot) ? 'BOOKED' : 'AVAILABLE',
    }));

    return apiSuccess(res, {
      date,
      doctorId: id,
      isDoctorAvailable: true,
      workingHours: `${schedule.startTime} - ${schedule.endTime}`,
      slotDurationMins: duration,
      totalSlots: slotObjects.length,
      availableSlotsCount: slotObjects.filter(s => s.isAvailable).length,
      slots: slotObjects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/doctors
 * Add doctor (Hospital Admin)
 */
exports.createDoctor = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      hospitalId,
      departmentId,
      specialization,
      qualification,
      experienceYears = 0,
      consultationFee = 0,
    } = req.body;

    if (!name || !email || !password || !hospitalId || !departmentId || !specialization || !qualification) {
      return apiError(res, 'All required doctor profile fields must be provided.', 400);
    }

    // Check hospital authorization
    if (req.user.role !== 'SUPER_ADMIN') {
      const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
      if (!hospital || hospital.adminUserId !== req.user.id) {
        return apiError(res, 'You are not authorized to add doctors for this hospital.', 403);
      }
    }

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create doctor user & profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          phone,
          role: 'DOCTOR',
        },
      });

      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          hospitalId,
          departmentId,
          specialization,
          qualification,
          experienceYears: parseInt(experienceYears, 10),
          consultationFee: parseFloat(consultationFee),
          isAvailable: true,
        },
        include: { user: true, department: true },
      });

      // Create default Monday - Friday schedule (09:00 - 13:00)
      for (let day = 1; day <= 5; day++) {
        await tx.doctorSchedule.create({
          data: {
            doctorId: doctor.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '13:00',
            slotDurationMins: 15,
            maxPatients: 16,
          },
        });
      }

      return doctor;
    });

    return apiSuccess(res, result, 'Doctor profile and schedules created successfully', 201);
  } catch (error) {
    next(error);
  }
};
