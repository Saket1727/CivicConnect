const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');
const prisma = require('../config/prisma');
const http = require('http');

let server;
let baseUrl;
let superAdminToken;
let citizenToken;

before(async () => {
  await prisma.$connect();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}/api/v1`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

describe('CivicConnect Core Verification Test Suite', () => {
  test('1. System Health Check Endpoint', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ONLINE');
    assert.equal(data.service, 'CivicConnect Enterprise REST API');
  });

  test('2. Authentication: Invalid credentials rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@civicconnect.gov.in', password: 'WrongPassword' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('3. Authentication: Valid Login for SuperAdmin & Citizen', async () => {
    // SuperAdmin
    const adminRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@civicconnect.gov.in', password: 'Admin@123456' }),
    });
    assert.equal(adminRes.status, 200);
    const adminBody = await adminRes.json();
    assert.ok(adminBody.data.token);
    assert.equal(adminBody.data.user.role, 'SUPER_ADMIN');
    superAdminToken = adminBody.data.token;

    // Citizen
    const citizenRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.citizen@gmail.com', password: 'Password@123' }),
    });
    assert.equal(citizenRes.status, 200);
    const citizenBody = await citizenRes.json();
    assert.ok(citizenBody.data.token);
    assert.equal(citizenBody.data.user.role, 'CITIZEN');
    citizenToken = citizenBody.data.token;
  });

  test('4. RBAC: Deny-by-default access protection on Admin Endpoints', async () => {
    // Without token -> 401
    const noTokenRes = await fetch(`${baseUrl}/admin/stats`);
    assert.equal(noTokenRes.status, 401);

    // Citizen token -> 403 Forbidden
    const forbiddenRes = await fetch(`${baseUrl}/admin/stats`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert.equal(forbiddenRes.status, 403);

    // SuperAdmin token -> 200 OK with real DB metrics
    const allowedRes = await fetch(`${baseUrl}/admin/stats`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(allowedRes.status, 200);
    const data = await allowedRes.json();
    assert.ok(data.data.hospitals.total >= 4);
    assert.ok(data.data.doctors.total >= 4);
    assert.ok(data.data.beds.total > 0);
  });

  test('5. Geospatial Hospital Discovery & Provenance Boundary', async () => {
    const res = await fetch(`${baseUrl}/hospitals?lat=28.5672&lng=77.2100&radiusKm=25`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data.length > 0);

    // Verify unverified hospitals are excluded from public search
    const unverifiedFound = body.data.some(h => h.status === 'PENDING_VERIFICATION');
    assert.equal(unverifiedFound, false, 'Unverified hospital must not be exposed to public');

    // Verify Simulated data label separation
    const simulated = body.data.find(h => h.isSimulated);
    if (simulated) {
      assert.equal(simulated.provenance, 'SIMULATED_DEMO');
      assert.ok(simulated.dataSourceNotice.includes('SIMULATION'));
    }

    // Verify Verified provider separation
    const verified = body.data.find(h => !h.isSimulated && !h.isThirdParty);
    assert.ok(verified);
    assert.equal(verified.provenance, 'REGISTERED_VERIFIED');
    assert.equal(verified.status, 'VERIFIED');
  });

  test('6. Bed Availability: Formula constraint validation', async () => {
    const aiims = await prisma.hospital.findFirst({ where: { name: { contains: 'AIIMS' } } });
    assert.ok(aiims);

    // Attempt to update with occupied > total -> Must return 400
    const invalidRes = await fetch(`${baseUrl}/hospitals/${aiims.id}/beds`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        category: 'ICU',
        totalBeds: 20,
        occupiedBeds: 25, // Invalid: occupied > total
      }),
    });
    assert.equal(invalidRes.status, 400);

    // Valid update
    const validRes = await fetch(`${baseUrl}/hospitals/${aiims.id}/beds`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        category: 'ICU',
        totalBeds: 50,
        occupiedBeds: 35,
      }),
    });
    assert.equal(validRes.status, 200);
    const validBody = await validRes.json();
    assert.equal(validBody.data.availableBeds, 15); // 50 - 35 = 15
  });

  test('7. Doctor OPD Slots: Generates scheduled time slots', async () => {
    const doctor = await prisma.doctor.findFirst();
    assert.ok(doctor);

    // Query tomorrow (weekday)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    // ensure weekday Mon-Fri
    while (targetDate.getDay() === 0 || targetDate.getDay() === 6) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    const dateStr = targetDate.toISOString().split('T')[0];

    const res = await fetch(`${baseUrl}/doctors/${doctor.id}/slots?date=${dateStr}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.isDoctorAvailable, true);
    assert.ok(body.data.slots.length > 0);
  });

  test('8. Environmental Observations: Weather & AQI endpoint', async () => {
    const res = await fetch(`${baseUrl}/environment?lat=28.6139&lon=77.2090`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.success);
    assert.ok(body.data.source);
  });
});
