const prisma = require('../config/prisma');
const { apiSuccess, apiError } = require('../utils/response');

/**
 * GET /api/v1/schemes
 * Public welfare schemes directory
 */
exports.getSchemes = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    const where = { isActive: true };
    if (category) where.category = { contains: category };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { benefits: { contains: search } },
      ];
    }

    const schemes = await prisma.welfareScheme.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(res, schemes, 'Welfare schemes retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/schemes
 * Super Admin adds scheme
 */
exports.createScheme = async (req, res, next) => {
  try {
    const { name, category, description, eligibility, benefits, documentsRequired, officialPortalUrl } = req.body;

    if (!name || !description || !eligibility || !benefits || !documentsRequired || !officialPortalUrl) {
      return apiError(res, 'All scheme information fields are required.', 400);
    }

    const scheme = await prisma.welfareScheme.create({
      data: {
        name,
        category: category || 'Government Healthcare Initiative',
        description,
        eligibility,
        benefits,
        documentsRequired,
        officialPortalUrl,
      },
    });

    return apiSuccess(res, scheme, 'Welfare scheme created successfully', 201);
  } catch (error) {
    next(error);
  }
};
