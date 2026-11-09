const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const errorHandler = require('./middleware/error.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const hospitalRoutes = require('./routes/hospital.routes');
const doctorRoutes = require('./routes/doctor.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const emergencyRoutes = require('./routes/emergency.routes');
const patientRoutes = require('./routes/patient.routes');
const pharmacyRoutes = require('./routes/pharmacy.routes');
const bloodBankRoutes = require('./routes/bloodBank.routes');
const ambulanceRoutes = require('./routes/ambulance.routes');
const civicRoutes = require('./routes/civic.routes');
const schemeRoutes = require('./routes/scheme.routes');
const reviewRoutes = require('./routes/review.routes');
const adminRoutes = require('./routes/admin.routes');
const geoRoutes = require('./routes/geo.routes');
const environmentRoutes = require('./routes/environment.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

// Security & Parsing Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'CivicConnect Enterprise REST API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: 'MySQL 8/9 Engine Active',
  });
});

// Minimal Swagger documentation specification
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'CivicConnect Healthcare Platform REST API',
    version: '1.0.0',
    description: 'Comprehensive API documentation for CivicConnect B.Tech Major Project.',
  },
  servers: [{ url: 'http://localhost:5000/api/v1' }],
  paths: {
    '/health': { get: { summary: 'System health check' } },
    '/auth/login': { post: { summary: 'User login' } },
    '/auth/register': { post: { summary: 'Citizen registration' } },
    '/hospitals': { get: { summary: 'Geospatial hospital discovery' } },
    '/doctors': { get: { summary: 'Doctor discovery' } },
    '/appointments/book': { post: { summary: 'Book OPD appointment' } },
    '/emergency/register': { post: { summary: 'Emergency OPD triage registration' } },
    '/pharmacies/medicines': { get: { summary: 'Medicine discovery' } },
    '/blood-banks': { get: { summary: 'Blood bank search' } },
    '/ambulances/request': { post: { summary: 'Request emergency ambulance' } },
    '/complaints': { get: { summary: 'Civic complaints' }, post: { summary: 'File complaint' } },
    '/schemes': { get: { summary: 'Government welfare schemes' } },
    '/environment': { get: { summary: 'Live Weather and Air Quality (AQI)' } },
  },
};
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount Route Endpoints
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/emergency', emergencyRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/pharmacies', pharmacyRoutes);
app.use('/api/v1/blood-banks', bloodBankRoutes);
app.use('/api/v1/ambulances', ambulanceRoutes);
app.use('/api/v1/complaints', civicRoutes);
app.use('/api/v1/schemes', schemeRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/geo', geoRoutes);
app.use('/api/v1/environment', environmentRoutes);
app.use('/api/v1/ai', aiRoutes);

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
