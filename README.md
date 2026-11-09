# CivicConnect
## A Civic Health and Emergency Assistance Platform with Geospatial Facility Discovery
**B.Tech Final-Year Major Project in Computer Science & Engineering**

---

## 1. Project Overview
**CivicConnect** is a unified civic healthcare discovery, hospital management, and emergency assistance web platform designed for Indian citizens, healthcare providers, and municipal authorities.

The platform addresses acute challenges in Indian healthcare delivery:
- **Fragmented Healthcare Information**: Disconnect between citizens and nearby verified facilities.
- **Critical Emergency Delay**: Inability to alert casualty desks or locate ambulance units during trauma.
- **Unverified Bed Availability**: Fabricated or outdated ICU/general bed figures during medical emergencies.
- **Blood & Medicine Deficits**: Lack of real-time inventory visibility across registered blood banks and pharmacies.
- **Civic Health Hazards**: Unmonitored sanitation and drainage issues that trigger preventable epidemics.

---

## 2. Technology Stack

### Frontend
- **React.js 19** with **Vite**
- **Tailwind CSS** (Custom healthcare palette)
- **React Router DOM 7** (Role-guarded routing)
- **Axios** (JWT interceptor & centralized error handling)
- **Leaflet & React-Leaflet** (Interactive OpenStreetMap tile layer, custom hospital pins)
- **Recharts** (Hospital occupancy charts, appointment distribution analytics)
- **Lucide React** (Modern clean medical icons)

### Backend
- **Node.js 24 & Express.js**
- **RESTful API Architecture** (Versioned at `/api/v1`)
- **JSON Web Tokens (JWT)** & **bcryptjs** password hashing
- **Role-Based Access Control (RBAC)** across 9 user roles
- **Zod Validation Engine** (Strict request schema enforcement)
- **Swagger / OpenAPI 3.0** (`/api/docs`)

### Database & Spatial Persistence
- **MySQL 8/9 Engine**
- **Prisma ORM 6** (Type-safe client, relational constraints, foreign keys, migrations)
- **MySQL Spatial Functions** (`ST_Distance_Sphere`, Great-Circle Haversine calculations)
- **ACID Database Transactions** for concurrent appointment booking and bed counts

### External Services & Ethical Data Boundaries
- **OpenStreetMap & Overpass API**: Real-world third-party healthcare nodes.
- **Nominatim**: Geocoding and reverse geocoding for Indian cities and PIN codes.
- **Open-Meteo**: Real-time atmospheric observations and Air Quality Index (AQI).
- **Google Gemini API / Deterministic Clinical Rule Engine**: Informational healthcare advisory assistant.

---

## 3. Strict Data Provenance Rules

| Data Tier | Provenance Source | Bed / OPD Figures | Ethics & Verification |
| :--- | :--- | :--- | :--- |
| **Tier 1: Registered Providers** | MySQL (`Hospital` entity) | Real-time validated figures | Verified by SuperAdmin before publishing availability. |
| **Tier 2: Third-Party Facilities** | OpenStreetMap (ODbL) | **Never fabricated (NULL)** | Sourced under Open Database License. Real-time availability is never falsified. |
| **Tier 3: Academic Demo Facilities** | MySQL (`isSimulated: true`) | Active demonstration figures | Explicitly labeled `[SIMULATED DATA]` for examination testing. |

---

## 4. User Roles & Access Control Matrix

1. **CITIZEN**: Search facilities, check bed counts, book OPD consultations, register emergency triage, request ambulances, view prescriptions, file civic complaints.
2. **HOSPITAL_ADMIN**: Manage beds (`Available = Total - Occupied`), review & decide appointments (ACCEPT/REJECT), manage doctor rosters and hospital analytics.
3. **DOCTOR**: View today's consultation roster, accept/reject OPD slots, write electronic prescriptions, record clinical diagnoses.
4. **BLOOD_BANK_ADMIN**: Update stock units across all 8 blood groups (A+, A-, B+, B-, AB+, AB-, O+, O-).
5. **PHARMACY_ADMIN**: Update medicine inventory, unit prices, batch numbers, and stock levels.
6. **AMBULANCE_PROVIDER**: Monitor dispatch requests, accept emergencies (which unlocks patient phone), update status to Dispatched and Completed.
7. **AUTHORITY**: Review and resolve municipal sanitation, water supply, and public health complaints.
8. **SUPER_ADMIN**: Platform command center, approve/reject pending hospital registrations, audit security logs, monitor platform-wide KPIs.

---

## 5. Quick Start & Execution Guide

### Prerequisites
- **Node.js** v18+ (tested on v24.14.1)
- **npm** v9+
- **MySQL 8 or 9** running locally on port 3306

### Step 1: Clone & Configure Backend
```bash
cd backend
cp .env.example .env # Or verify backend/.env settings
```

Ensure your `backend/.env` contains your MySQL credentials:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="mysql://root:password@127.0.0.1:3306/civicconnect"
JWT_SECRET=civicconnect_super_secure_jwt_secret_key_2026_btech_major_project
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
OPEN_METEO_BASE_URL=https://api.open-meteo.com/v1
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
```

### Step 2: Push Database Schema & Seed Realistic Data
```bash
cd backend
# Synchronize 25 relational tables with MySQL
npx prisma db push

# Seed realistic hospitals (AIIMS, Safdarjung, Apollo, Max), doctors, beds, and demo accounts
node prisma/seed.js
```

### Step 3: Run Backend Automated Test Suite
```bash
cd backend
npm test
```
*Expected: 8/8 test suites passing (Health, Auth, RBAC, Bed Formula, Doctor Slots, Geospatial Provenance, AQI).*

### Step 4: Start Backend REST API
```bash
cd backend
npm start
# REST API active at http://localhost:5000
# OpenAPI Swagger docs at http://localhost:5000/api/docs
```

### Step 5: Start Frontend Application
In a separate terminal:
```bash
cd frontend
npm run dev
# Frontend active at http://localhost:5173
```

---

## 6. Pre-Configured Demo Credentials for Viva / Evaluation

The login page (`/login`) includes **1-Click Evaluator Buttons** for instant evaluation without typing:

| Role | Email | Password | Pre-loaded Data |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `admin@civicconnect.gov.in` | `Admin@123456` | Platform KPIs, Pending Verifications, Audit Logs |
| **AIIMS Hospital Admin** | `admin@aiims.edu` | `Password@123` | Bed controller, OPD review queue, Emergency triage |
| **Apollo Hospital Admin** | `admin@apollohospitals.com` | `Password@123` | Private hospital bed controller & doctors |
| **Doctor (AIIMS Cardiology)** | `dr.sharma@aiims.edu` | `Password@123` | Daily OPD consultations, E-prescription builder |
| **Citizen (Patient)** | `rahul.citizen@gmail.com` | `Password@123` | Past appointments, prescriptions, health profile |
| **Ambulance Driver (CATS 102)**| `ramesh.ambulance@delhiems.org` | `Password@123` | Paramedic dispatch console, status tracker |
| **Blood Bank Administrator** | `bloodbank@redcrossdelhi.org` | `Password@123` | Indian Red Cross Blood Bank inventory manager |
| **Municipal Authority** | `authority@mcd.gov.in` | `Password@123` | Sanitation & public health complaints redressal |

---

## 7. Key REST API Endpoints

- `GET /api/v1/health` - System health check
- `POST /api/v1/auth/register` - Citizen patient registration
- `POST /api/v1/auth/login` - Authenticate & obtain JWT
- `GET /api/v1/hospitals` - Geospatial discovery with distance, filters & OSM nodes
- `GET /api/v1/hospitals/:id` - Full hospital details, bed categories & reviews
- `PUT /api/v1/hospitals/:id/beds` - Update bed occupancy (`Available = Total - Occupied`)
- `GET /api/v1/doctors/:id/slots` - Query real-time available doctor OPD slots
- `POST /api/v1/appointments/book` - Submit appointment request (`PENDING`)
- `PUT /api/v1/appointments/:id/status` - Doctor/Admin accepts or rejects appointment
- `POST /api/v1/emergency/register` - Urgent emergency OPD registration
- `GET /api/v1/pharmacies/medicines` - Discover essential medicines across pharmacies
- `GET /api/v1/blood-banks` - Discover blood units by blood group
- `POST /api/v1/ambulances/request` - Dispatch emergency ambulance
- `POST /api/v1/complaints` - Lodge municipal public health complaint
- `GET /api/v1/schemes` - Government welfare schemes (PM-JAY, CGHS, RAN)
- `GET /api/v1/environment` - Live Open-Meteo Weather & AQI observations
- `POST /api/v1/ai/chat` - Healthcare advisory conversational assistant
