const prisma = require('../config/prisma');
const { apiSuccess, apiError } = require('../utils/response');

/**
 * GET /api/v1/admin/stats
 * Real platform database aggregates
 */
exports.getPlatformStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      usersByRole,
      hospitals,
      pendingHospitalsCount,
      totalDoctors,
      beds,
      appointments,
      emergencyRegistrations,
      bloodBanks,
      bloodUnits,
      pharmacies,
      medicinesCount,
      ambulanceRequests,
      civicComplaints,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
      prisma.hospital.findMany({ select: { id: true, status: true, isSimulated: true } }),
      prisma.hospital.count({ where: { status: 'PENDING_VERIFICATION' } }),
      prisma.doctor.count(),
      prisma.hospitalBed.findMany({ select: { totalBeds: true, occupiedBeds: true, availableBeds: true } }),
      prisma.appointment.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.emergencyRegistration.groupBy({ by: ['triagePriority'], _count: { id: true } }),
      prisma.bloodBank.count(),
      prisma.bloodInventory.aggregate({ _sum: { unitsAvailable: true } }),
      prisma.pharmacy.count(),
      prisma.pharmacyInventory.count(),
      prisma.ambulanceRequest.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.civicComplaint.groupBy({ by: ['status'], _count: { id: true } }),
    ]);

    const totalBedsCount = beds.reduce((acc, b) => acc + b.totalBeds, 0);
    const occupiedBedsCount = beds.reduce((acc, b) => acc + b.occupiedBeds, 0);
    const availableBedsCount = beds.reduce((acc, b) => acc + b.availableBeds, 0);

    const stats = {
      users: {
        total: totalUsers,
        roles: usersByRole.reduce((acc, r) => ({ ...acc, [r.role]: r._count.id }), {}),
      },
      hospitals: {
        total: hospitals.length,
        verified: hospitals.filter(h => h.status === 'VERIFIED').length,
        pending: pendingHospitalsCount,
        simulated: hospitals.filter(h => h.isSimulated).length,
      },
      doctors: {
        total: totalDoctors,
      },
      beds: {
        total: totalBedsCount,
        occupied: occupiedBedsCount,
        available: availableBedsCount,
        occupancyRatePercent: totalBedsCount > 0 ? parseFloat(((occupiedBedsCount / totalBedsCount) * 100).toFixed(1)) : 0,
      },
      appointments: {
        total: appointments.reduce((sum, a) => sum + a._count.id, 0),
        breakdown: appointments.reduce((acc, a) => ({ ...acc, [a.status]: a._count.id }), {}),
      },
      emergency: {
        total: emergencyRegistrations.reduce((sum, e) => sum + e._count.id, 0),
        breakdown: emergencyRegistrations.reduce((acc, e) => ({ ...acc, [e.triagePriority]: e._count.id }), {}),
      },
      bloodBanks: {
        total: bloodBanks,
        totalUnits: bloodUnits._sum.unitsAvailable || 0,
      },
      pharmacies: {
        total: pharmacies,
        totalMedicineSKUs: medicinesCount,
      },
      ambulances: {
        totalRequests: ambulanceRequests.reduce((sum, a) => sum + a._count.id, 0),
        breakdown: ambulanceRequests.reduce((acc, a) => ({ ...acc, [a.status]: a._count.id }), {}),
      },
      civicComplaints: {
        total: civicComplaints.reduce((sum, c) => sum + c._count.id, 0),
        breakdown: civicComplaints.reduce((acc, c) => ({ ...acc, [c.status]: c._count.id }), {}),
      },
    };

    return apiSuccess(res, stats, 'Platform analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/verifications
 * Pending hospital verifications
 */
exports.getPendingVerifications = async (req, res, next) => {
  try {
    const pendingHospitals = await prisma.hospital.findMany({
      where: { status: 'PENDING_VERIFICATION' },
      include: {
        adminUser: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(res, pendingHospitals, 'Pending verifications retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/verifications/:id
 * Super Admin verifies or rejects a hospital
 */
exports.verifyHospital = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['VERIFIED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      return apiError(res, 'Status must be VERIFIED, REJECTED, or SUSPENDED.', 400);
    }

    const hospital = await prisma.hospital.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return apiSuccess(res, hospital, `Hospital status transitioned to ${status}`);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/users
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;

    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return apiSuccess(res, users, 'Users retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/logs
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return apiSuccess(res, logs, 'Security audit logs retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/hospital-reports/:hospitalId
 * Detailed hospital report for hospital admin / super admin
 */
exports.getHospitalReports = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;

    const [hospital, beds, appointments, emergencies, doctors] = await Promise.all([
      prisma.hospital.findUnique({ where: { id: hospitalId } }),
      prisma.hospitalBed.findMany({ where: { hospitalId } }),
      prisma.appointment.findMany({
        where: { hospitalId },
        select: { id: true, status: true, appointmentDate: true, doctorId: true },
      }),
      prisma.emergencyRegistration.findMany({
        where: { hospitalId },
        select: { id: true, triagePriority: true, status: true, createdAt: true },
      }),
      prisma.doctor.findMany({
        where: { hospitalId },
        include: {
          user: { select: { name: true } },
          _count: { select: { appointments: true } },
        },
      }),
    ]);

    if (!hospital) return apiError(res, 'Hospital not found.', 404);

    // Bed metrics
    const totalBeds = beds.reduce((acc, b) => acc + b.totalBeds, 0);
    const occupiedBeds = beds.reduce((acc, b) => acc + b.occupiedBeds, 0);
    const availableBeds = beds.reduce((acc, b) => acc + b.availableBeds, 0);

    // Bed distribution for Recharts
    const bedCategoryData = beds.map(b => ({
      category: b.category,
      total: b.totalBeds,
      occupied: b.occupiedBeds,
      available: b.availableBeds,
    }));

    // Doctor appointment distribution
    const doctorStats = doctors.map(d => ({
      name: d.user.name,
      appointments: d._count.appointments,
      specialization: d.specialization,
    }));

    // Appointment status breakdown
    const appointmentStatusBreakdown = appointments.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    return apiSuccess(res, {
      hospital: { id: hospital.id, name: hospital.name, status: hospital.status, isSimulated: hospital.isSimulated },
      summary: {
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate: totalBeds > 0 ? parseFloat(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0,
        totalAppointments: appointments.length,
        totalEmergencies: emergencies.length,
        totalDoctors: doctors.length,
      },
      bedCategoryData,
      doctorStats,
      appointmentStatusBreakdown,
    }, 'Hospital analytics report retrieved');
  } catch (error) {
    next(error);
  }
};
