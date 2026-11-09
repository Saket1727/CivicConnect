const prisma = require('../config/prisma');
const { apiSuccess, apiError } = require('../utils/response');
const { fetchOSMHospitals } = require('../integrations/osm.service');

/**
 * Calculate Great-Circle distance between two points in km (Haversine formula)
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * GET /api/v1/hospitals
 * Multi-source geospatial discovery engine
 */
exports.getHospitals = async (req, res, next) => {
  try {
    const {
      lat,
      lng,
      radiusKm = 20,
      search,
      city,
      type,
      provenance = 'all', // 'all', 'verified', 'simulated', 'osm'
      sortBy = 'distance', // 'distance', 'name', 'rating'
    } = req.query;

    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;
    const maxRadius = parseFloat(radiusKm);

    // 1. Build MySQL Query for Registered/Simulated Hospitals
    const where = {
      status: 'VERIFIED', // Unverified hospitals are never shown in public directory
    };

    if (provenance === 'verified') {
      where.isSimulated = false;
    } else if (provenance === 'simulated') {
      where.isSimulated = true;
    }

    if (type && ['GOVERNMENT', 'PRIVATE', 'TRUST'].includes(type.toUpperCase())) {
      where.type = type.toUpperCase();
    }

    if (city) {
      where.city = { contains: city };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { address: { contains: search } },
        { city: { contains: search } },
        { pincode: { contains: search } },
      ];
    }

    const dbHospitals = await prisma.hospital.findMany({
      where,
      include: {
        beds: true,
        departments: { select: { id: true, name: true } },
        doctors: { select: { id: true, specialization: true } },
        reviews: { select: { rating: true } },
      },
    });

    // Format DB results
    const formattedDbHospitals = dbHospitals.map(h => {
      const distance = userLat && userLng ? calculateDistanceKm(userLat, userLng, h.latitude, h.longitude) : null;
      const totalRatings = h.reviews.length;
      const avgRating = totalRatings > 0
        ? parseFloat((h.reviews.reduce((acc, r) => acc + r.rating, 0) / totalRatings).toFixed(1))
        : 4.5; // Baseline for major hospitals

      const totalBeds = h.beds.reduce((acc, b) => acc + b.totalBeds, 0);
      const availableBeds = h.beds.reduce((acc, b) => acc + b.availableBeds, 0);
      const icuBeds = h.beds.find(b => b.category === 'ICU');

      return {
        id: h.id,
        name: h.name,
        registrationNo: h.registrationNo,
        type: h.type,
        status: h.status,
        address: h.address,
        city: h.city,
        state: h.state,
        pincode: h.pincode,
        latitude: h.latitude,
        longitude: h.longitude,
        phone: h.phone,
        emergencyPhone: h.emergencyPhone,
        website: h.website,
        distanceKm: distance,
        rating: avgRating,
        reviewCount: totalRatings,
        isSimulated: h.isSimulated,
        provenance: h.isSimulated ? 'SIMULATED_DEMO' : 'REGISTERED_VERIFIED',
        dataSourceNotice: h.isSimulated
          ? 'ACADEMIC SIMULATION: For educational demonstration only. Availability numbers are simulated.'
          : 'VERIFIED PROVIDER: Official registered facility with verified hospital authority.',
        bedSummary: {
          totalBeds,
          availableBeds,
          icuAvailable: icuBeds ? icuBeds.availableBeds : 0,
        },
        departmentCount: h.departments.length,
        doctorCount: h.doctors.length,
        canBookAppointment: true,
      };
    });

    // 2. Fetch Third-Party OpenStreetMap Hospitals if enabled
    let osmHospitals = [];
    if ((provenance === 'all' || provenance === 'osm') && userLat && userLng) {
      osmHospitals = await fetchOSMHospitals(userLat, userLng, maxRadius);
      // Filter OSM by search query if present
      if (search) {
        const s = search.toLowerCase();
        osmHospitals = osmHospitals.filter(h =>
          h.name.toLowerCase().includes(s) ||
          h.address.toLowerCase().includes(s) ||
          h.city.toLowerCase().includes(s)
        );
      }
      // Calculate distance for OSM items
      osmHospitals = osmHospitals.map(h => ({
        ...h,
        distanceKm: calculateDistanceKm(userLat, userLng, h.latitude, h.longitude),
      }));
    }

    // Combine results
    let combined = [...formattedDbHospitals, ...osmHospitals];

    // Filter by radius if user provided coordinates
    if (userLat && userLng && maxRadius) {
      combined = combined.filter(h => h.distanceKm === null || h.distanceKm <= maxRadius);
    }

    // Sort
    if (sortBy === 'distance' && userLat && userLng) {
      combined.sort((a, b) => (a.distanceKm || 99999) - (b.distanceKm || 99999));
    } else if (sortBy === 'rating') {
      combined.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'name') {
      combined.sort((a, b) => a.name.localeCompare(b.name));
    }

    return apiSuccess(res, combined, 'Hospitals retrieved successfully', 200, {
      totalFound: combined.length,
      verifiedCount: formattedDbHospitals.filter(h => !h.isSimulated).length,
      simulatedCount: formattedDbHospitals.filter(h => h.isSimulated).length,
      osmCount: osmHospitals.length,
      userCoordinates: userLat && userLng ? { latitude: userLat, longitude: userLng } : null,
      radiusKm: maxRadius,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/hospitals/:id
 */
exports.getHospitalById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Handle OpenStreetMap facility
    if (id.startsWith('osm-')) {
      return apiSuccess(res, {
        id,
        name: 'OpenStreetMap Discovered Facility',
        address: 'Real-world healthcare facility discovered via OSM Overpass API',
        type: 'GOVERNMENT',
        status: 'VERIFIED',
        isThirdParty: true,
        provenance: 'OPEN_STREET_MAP',
        dataSourceNotice: 'Discovered via OpenStreetMap (ODbL). Real-time bed availability and appointments are not claimed or fabricated for external OSM records.',
        attribution: '© OpenStreetMap contributors (ODbL)',
        beds: [],
        departments: [],
        doctors: [],
        canBookAppointment: false,
      });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        departments: {
          include: {
            doctors: {
              include: {
                user: { select: { name: true, email: true, phone: true } },
                schedules: true,
              },
            },
          },
        },
        beds: true,
        pharmacies: {
          include: {
            inventory: { take: 10 },
          },
        },
        reviews: {
          include: {
            user: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!hospital) {
      return apiError(res, 'Hospital not found in database.', 404);
    }

    // If pending verification, only hospital admin or super admin can access
    if (hospital.status === 'PENDING_VERIFICATION') {
      if (!req.user || (req.user.role !== 'SUPER_ADMIN' && hospital.adminUserId !== req.user.id)) {
        return apiError(res, 'This hospital registration is pending administrative verification.', 403);
      }
    }

    const totalRatings = hospital.reviews.length;
    const avgRating = totalRatings > 0
      ? parseFloat((hospital.reviews.reduce((acc, r) => acc + r.rating, 0) / totalRatings).toFixed(1))
      : 4.5;

    return apiSuccess(res, {
      ...hospital,
      rating: avgRating,
      reviewCount: totalRatings,
      provenance: hospital.isSimulated ? 'SIMULATED_DEMO' : 'REGISTERED_VERIFIED',
      canBookAppointment: hospital.status === 'VERIFIED',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/hospitals/register
 * Onboarding for new hospital
 */
exports.registerHospital = async (req, res, next) => {
  try {
    const {
      name,
      registrationNo,
      type = 'GOVERNMENT',
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,
      phone,
      emergencyPhone,
      email,
      website,
    } = req.body;

    if (!name || !registrationNo || !address || !city || !latitude || !longitude || !phone) {
      return apiError(res, 'Name, registration number, address, city, phone, and coordinates are required.', 400);
    }

    // Check duplicate registration
    const existing = await prisma.hospital.findUnique({ where: { registrationNo } });
    if (existing) {
      return apiError(res, 'A hospital with this registration number is already registered.', 409);
    }

    const hospital = await prisma.hospital.create({
      data: {
        name,
        registrationNo,
        type,
        status: 'PENDING_VERIFICATION', // Deny by default until SuperAdmin approves
        address,
        city,
        state: state || 'India',
        pincode,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        phone,
        emergencyPhone,
        email,
        website,
        isSimulated: false,
        adminUserId: req.user ? req.user.id : undefined,
      },
    });

    // Create default bed categories with 0 count
    const categories = ['GENERAL', 'ICU', 'EMERGENCY', 'OXYGEN', 'PEDIATRIC'];
    for (const cat of categories) {
      await prisma.hospitalBed.create({
        data: {
          hospitalId: hospital.id,
          category: cat,
          totalBeds: 0,
          occupiedBeds: 0,
          availableBeds: 0,
        },
      });
    }

    return apiSuccess(
      res,
      hospital,
      'Hospital registered successfully. It is currently under review (PENDING_VERIFICATION).',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/hospitals/:id/beds
 */
exports.getHospitalBeds = async (req, res, next) => {
  try {
    const { id } = req.params;
    const beds = await prisma.hospitalBed.findMany({
      where: { hospitalId: id },
    });

    const hospital = await prisma.hospital.findUnique({
      where: { id },
      select: { name: true, status: true, isSimulated: true },
    });

    return apiSuccess(res, {
      hospital,
      beds,
      lastUpdated: beds.length > 0 ? beds[0].lastUpdated : new Date(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/hospitals/:id/beds
 * Update bed counts (Hospital Admin only)
 */
exports.updateHospitalBeds = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, totalBeds, occupiedBeds } = req.body;

    if (!category || totalBeds === undefined || occupiedBeds === undefined) {
      return apiError(res, 'Category, totalBeds, and occupiedBeds are required.', 400);
    }

    const total = parseInt(totalBeds, 10);
    const occupied = parseInt(occupiedBeds, 10);

    if (total < 0 || occupied < 0) {
      return apiError(res, 'Bed numbers cannot be negative.', 400);
    }

    if (occupied > total) {
      return apiError(res, 'Occupied beds cannot exceed total beds.', 400);
    }

    const available = total - occupied;

    // Hospital ownership check
    if (req.user.role !== 'SUPER_ADMIN') {
      const hospital = await prisma.hospital.findUnique({ where: { id } });
      if (!hospital || hospital.adminUserId !== req.user.id) {
        return apiError(res, 'You are not authorized to manage beds for this hospital.', 403);
      }
    }

    const updated = await prisma.hospitalBed.upsert({
      where: {
        hospitalId_category: {
          hospitalId: id,
          category,
        },
      },
      update: {
        totalBeds: total,
        occupiedBeds: occupied,
        availableBeds: available,
        lastUpdated: new Date(),
      },
      create: {
        hospitalId: id,
        category,
        totalBeds: total,
        occupiedBeds: occupied,
        availableBeds: available,
      },
    });

    return apiSuccess(res, updated, 'Hospital bed allocation updated successfully');
  } catch (error) {
    next(error);
  }
};
