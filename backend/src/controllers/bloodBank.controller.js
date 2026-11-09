const prisma = require('../config/prisma');
const { apiSuccess, apiError } = require('../utils/response');

const BLOOD_GROUP_MAP = {
  'A+': 'A_POSITIVE',
  'A-': 'A_NEGATIVE',
  'B+': 'B_POSITIVE',
  'B-': 'B_NEGATIVE',
  'AB+': 'AB_POSITIVE',
  'AB-': 'AB_NEGATIVE',
  'O+': 'O_POSITIVE',
  'O-': 'O_NEGATIVE',
};

/**
 * GET /api/v1/blood-banks
 * Blood bank and inventory discovery
 */
exports.getBloodBanks = async (req, res, next) => {
  try {
    const { bloodGroup, city, search } = req.query;

    const where = {};
    if (city) where.city = { contains: city };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { address: { contains: search } },
      ];
    }

    const bloodBanks = await prisma.bloodBank.findMany({
      where,
      include: {
        inventory: true,
      },
    });

    const enumGroup = bloodGroup ? (BLOOD_GROUP_MAP[bloodGroup] || bloodGroup) : null;

    const formatted = bloodBanks.map(bb => {
      let filteredInventory = bb.inventory;
      if (enumGroup) {
        filteredInventory = bb.inventory.filter(i => i.bloodGroup === enumGroup);
      }

      const totalUnits = bb.inventory.reduce((acc, i) => acc + i.unitsAvailable, 0);

      return {
        id: bb.id,
        name: bb.name,
        licenseNo: bb.licenseNo,
        address: bb.address,
        city: bb.city,
        phone: bb.phone,
        latitude: bb.latitude,
        longitude: bb.longitude,
        isSimulated: bb.isSimulated,
        provenance: bb.isSimulated ? 'SIMULATED_DEMO' : 'VERIFIED_BLOOD_BANK',
        dataSourceNotice: bb.isSimulated
          ? 'SIMULATED DEMO: Blood unit figures are demonstration values.'
          : 'VERIFIED REGISTRATION: Live stock reported by authorized blood bank administrator.',
        totalUnitsAvailable: totalUnits,
        inventory: filteredInventory.map(i => ({
          bloodGroup: Object.keys(BLOOD_GROUP_MAP).find(k => BLOOD_GROUP_MAP[k] === i.bloodGroup) || i.bloodGroup,
          rawGroup: i.bloodGroup,
          unitsAvailable: i.unitsAvailable,
          lastUpdated: i.lastUpdated,
        })),
      };
    });

    // If specific blood group requested, prioritize banks with stock > 0
    if (enumGroup) {
      formatted.sort((a, b) => {
        const unitsA = a.inventory.reduce((sum, item) => sum + item.unitsAvailable, 0);
        const unitsB = b.inventory.reduce((sum, item) => sum + item.unitsAvailable, 0);
        return unitsB - unitsA;
      });
    }

    return apiSuccess(res, formatted, 'Blood banks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/blood-banks/:id/inventory
 * Update blood inventory (Blood Bank Admin)
 */
exports.updateBloodInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bloodGroup, unitsAvailable } = req.body;

    if (!bloodGroup || unitsAvailable === undefined) {
      return apiError(res, 'Blood group and units available are required.', 400);
    }

    const enumGroup = BLOOD_GROUP_MAP[bloodGroup] || bloodGroup;
    const units = parseInt(unitsAvailable, 10);

    if (units < 0) {
      return apiError(res, 'Blood units cannot be negative.', 400);
    }

    const updated = await prisma.bloodInventory.upsert({
      where: {
        bloodBankId_bloodGroup: {
          bloodBankId: id,
          bloodGroup: enumGroup,
        },
      },
      update: {
        unitsAvailable: units,
        lastUpdated: new Date(),
      },
      create: {
        bloodBankId: id,
        bloodGroup: enumGroup,
        unitsAvailable: units,
      },
    });

    return apiSuccess(res, updated, 'Blood inventory updated successfully');
  } catch (error) {
    next(error);
  }
};
