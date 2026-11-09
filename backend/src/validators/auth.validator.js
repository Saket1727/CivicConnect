const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  phone: z.string().optional(),
  role: z.enum([
    'CITIZEN',
    'HOSPITAL_ADMIN',
    'DOCTOR',
    'BLOOD_BANK_ADMIN',
    'PHARMACY_ADMIN',
    'AMBULANCE_PROVIDER',
    'AUTHORITY',
    'NGO_ADMIN',
    'SUPER_ADMIN',
  ]).default('CITIZEN'),
  // Citizen specific details
  gender: z.string().optional(),
  dob: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dob: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
};
