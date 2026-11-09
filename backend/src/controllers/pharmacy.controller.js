const prisma = require('../config/prisma');
const { apiSuccess, apiError } = require('../utils/response');

/**
 * GET /api/v1/pharmacies/medicines
 * Medicine discovery search engine
 */
exports.getMedicines = async (req, res, next) => {
  try {
    const { search, category, city, inStockOnly } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { medicineName: { contains: search } },
        { category: { contains: search } },
      ];
    }

    if (category) {
      where.category = { contains: category };
    }

    if (inStockOnly === 'true') {
      where.stockQuantity = { gt: 0 };
    }

    if (city) {
      where.pharmacy = {
        city: { contains: city },
      };
    }

    const items = await prisma.pharmacyInventory.findMany({
      where,
      include: {
        pharmacy: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
            latitude: true,
            longitude: true,
            isSimulated: true,
          },
        },
      },
      orderBy: { stockQuantity: 'desc' },
      take: 50,
    });

    const formatted = items.map(item => ({
      id: item.id,
      medicineName: item.medicineName,
      category: item.category,
      stockQuantity: item.stockQuantity,
      inStock: item.stockQuantity > 0,
      unitPrice: item.unitPrice,
      batchNo: item.batchNo,
      expiryDate: item.expiryDate,
      lastUpdated: item.lastUpdated,
      pharmacy: item.pharmacy,
      provenance: item.pharmacy.isSimulated ? 'SIMULATED_DEMO' : 'VERIFIED_PHARMACY',
    }));

    return apiSuccess(res, formatted, 'Medicines discovered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/pharmacies
 */
exports.getPharmacies = async (req, res, next) => {
  try {
    const { city, search } = req.query;
    const where = {};

    if (city) where.city = { contains: city };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { address: { contains: search } },
      ];
    }

    const pharmacies = await prisma.pharmacy.findMany({
      where,
      include: {
        inventory: { take: 5 },
      },
    });

    return apiSuccess(res, pharmacies, 'Pharmacies retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/pharmacies/:id/inventory
 * Update or add medicine stock (Pharmacy Admin)
 */
exports.updateInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { medicineName, category, stockQuantity, unitPrice, batchNo, expiryDate } = req.body;

    if (!medicineName || stockQuantity === undefined || unitPrice === undefined) {
      return apiError(res, 'Medicine name, stock quantity, and price are required.', 400);
    }

    const qty = parseInt(stockQuantity, 10);
    const price = parseFloat(unitPrice);

    if (qty < 0 || price < 0) {
      return apiError(res, 'Stock quantity and unit price cannot be negative.', 400);
    }

    const item = await prisma.pharmacyInventory.create({
      data: {
        pharmacyId: id,
        medicineName,
        category: category || 'General Medicine',
        stockQuantity: qty,
        unitPrice: price,
        batchNo,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      },
    });

    return apiSuccess(res, item, 'Inventory updated successfully', 201);
  } catch (error) {
    next(error);
  }
};
