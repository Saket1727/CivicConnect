const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { apiSuccess, apiError } = require('../utils/response');
const { registerSchema, loginSchema, updateProfileSchema } = require('../validators/auth.validator');

const JWT_SECRET = process.env.JWT_SECRET || 'civicconnect_super_secure_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token helper
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * POST /api/v1/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    if (existing) {
      return apiError(res, 'An account with this email address already exists.', 409);
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        phone: validatedData.phone,
        role: validatedData.role,
        patientProfile: validatedData.role === 'CITIZEN' ? {
          create: {
            gender: validatedData.gender,
            dob: validatedData.dob ? new Date(validatedData.dob) : undefined,
            bloodGroup: validatedData.bloodGroup,
            address: validatedData.address,
            city: validatedData.city,
            state: validatedData.state,
            pincode: validatedData.pincode,
          },
        } : undefined,
      },
      include: {
        patientProfile: true,
      },
    });

    const token = generateToken(user);

    return apiSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          patientProfile: user.patientProfile,
        },
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        patientProfile: true,
        managedHospitals: { select: { id: true, name: true, status: true } },
        doctorProfile: { select: { id: true, hospitalId: true, specialization: true } },
        ambulanceProvider: { select: { id: true, vehicleNo: true, isAvailable: true } },
        managedBloodBanks: { select: { id: true, name: true } },
        managedPharmacies: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      return apiError(res, 'Invalid email or password credentials.', 401);
    }

    if (!user.isActive) {
      return apiError(res, 'Your account has been deactivated. Please contact support.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return apiError(res, 'Invalid email or password credentials.', 401);
    }

    const token = generateToken(user);

    return apiSuccess(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        patientProfile: user.patientProfile,
        hospital: user.managedHospitals?.[0] || null,
        doctor: user.doctorProfile || null,
        ambulanceProvider: user.ambulanceProvider || null,
        bloodBank: user.managedBloodBanks?.[0] || null,
        pharmacy: user.managedPharmacies?.[0] || null,
      },
    }, 'Authentication successful');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        patientProfile: true,
        managedHospitals: true,
        doctorProfile: {
          include: {
            hospital: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
          },
        },
        ambulanceProvider: true,
        managedBloodBanks: true,
        managedPharmacies: true,
      },
    });

    if (!user) {
      return apiError(res, 'User not found.', 404);
    }

    return apiSuccess(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      patientProfile: user.patientProfile,
      hospital: user.managedHospitals?.[0] || null,
      doctor: user.doctorProfile || null,
      ambulanceProvider: user.ambulanceProvider || null,
      bloodBank: user.managedBloodBanks?.[0] || null,
      pharmacy: user.managedPharmacies?.[0] || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/auth/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const validated = updateProfileSchema.parse(req.body);

    const userUpdate = {};
    if (validated.name) userUpdate.name = validated.name;
    if (validated.phone) userUpdate.phone = validated.phone;

    const patientUpdate = {
      gender: validated.gender,
      dob: validated.dob ? new Date(validated.dob) : undefined,
      bloodGroup: validated.bloodGroup,
      emergencyContactName: validated.emergencyContactName,
      emergencyContactPhone: validated.emergencyContactPhone,
      allergies: validated.allergies,
      chronicConditions: validated.chronicConditions,
      address: validated.address,
      city: validated.city,
      state: validated.state,
      pincode: validated.pincode,
    };

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...userUpdate,
        patientProfile: req.user.role === 'CITIZEN' ? {
          upsert: {
            create: patientUpdate,
            update: patientUpdate,
          },
        } : undefined,
      },
      include: { patientProfile: true },
    });

    return apiSuccess(res, updatedUser, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};
