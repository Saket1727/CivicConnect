const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for CivicConnect...');

  // Clean existing tables in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.hospitalReview.deleteMany();
  await prisma.civicComplaint.deleteMany();
  await prisma.welfareScheme.deleteMany();
  await prisma.ambulanceRequest.deleteMany();
  await prisma.ambulanceProvider.deleteMany();
  await prisma.bloodInventory.deleteMany();
  await prisma.bloodBank.deleteMany();
  await prisma.pharmacyInventory.deleteMany();
  await prisma.pharmacy.deleteMany();
  await prisma.hospitalBed.deleteMany();
  await prisma.medicalDocument.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.patientMedicalRecord.deleteMany();
  await prisma.emergencyRegistration.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorUnavailableDate.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.hospitalDepartment.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash('Password@123', 10);
  const adminPassword = await bcrypt.hash('Admin@123456', 10);

  // 1. Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      name: 'National Healthcare Authority SuperAdmin',
      email: 'admin@civicconnect.gov.in',
      passwordHash: adminPassword,
      phone: '+91 11 23978046',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  // 2. Municipal Authority
  const municipalAuthority = await prisma.user.create({
    data: {
      name: 'Delhi Municipal Health Officer',
      email: 'authority@mcd.gov.in',
      passwordHash: defaultPassword,
      phone: '+91 11 23225501',
      role: 'AUTHORITY',
      isActive: true,
    },
  });

  // 3. Hospital Admins
  const aiimsAdmin = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh AIIMS Director Office',
      email: 'admin@aiims.edu',
      passwordHash: defaultPassword,
      phone: '+91 11 26588500',
      role: 'HOSPITAL_ADMIN',
      isActive: true,
    },
  });

  const safdarjungAdmin = await prisma.user.create({
    data: {
      name: 'Safdarjung Medical Superintendent',
      email: 'admin@safdarjung.gov.in',
      passwordHash: defaultPassword,
      phone: '+91 11 26165060',
      role: 'HOSPITAL_ADMIN',
      isActive: true,
    },
  });

  const apolloAdmin = await prisma.user.create({
    data: {
      name: 'Apollo Hospital Admin',
      email: 'admin@apollohospitals.com',
      passwordHash: defaultPassword,
      phone: '+91 11 71791090',
      role: 'HOSPITAL_ADMIN',
      isActive: true,
    },
  });

  const maxAdmin = await prisma.user.create({
    data: {
      name: 'Max Healthcare Admin',
      email: 'admin@maxhealthcare.com',
      passwordHash: defaultPassword,
      phone: '+91 11 26515050',
      role: 'HOSPITAL_ADMIN',
      isActive: true,
    },
  });

  const pendingHospitalAdmin = await prisma.user.create({
    data: {
      name: 'Metro Care Administrator',
      email: 'admin@metrocare.org',
      passwordHash: defaultPassword,
      phone: '+91 12 04567890',
      role: 'HOSPITAL_ADMIN',
      isActive: true,
    },
  });

  // 4. Hospitals
  const aiims = await prisma.hospital.create({
    data: {
      name: 'All India Institute of Medical Sciences (AIIMS)',
      registrationNo: 'GOV-DL-AIIMS-001',
      type: 'GOVERNMENT',
      status: 'VERIFIED',
      address: 'Sri Aurobindo Marg, Ansari Nagar East',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110029',
      latitude: 28.5672,
      longitude: 77.2100,
      phone: '011-26588500',
      emergencyPhone: '011-26594405',
      email: 'emergency@aiims.edu',
      website: 'https://www.aiims.edu',
      isSimulated: false,
      adminUserId: aiimsAdmin.id,
    },
  });

  const safdarjung = await prisma.hospital.create({
    data: {
      name: 'Vardhman Mahavir Medical College & Safdarjung Hospital',
      registrationNo: 'GOV-DL-SMC-002',
      type: 'GOVERNMENT',
      status: 'VERIFIED',
      address: 'Ring Road, Opposite AIIMS',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110029',
      latitude: 28.5702,
      longitude: 77.2078,
      phone: '011-26165060',
      emergencyPhone: '011-26707444',
      email: 'ms@safdarjung.gov.in',
      website: 'https://www.vmmc-sjh.nic.in',
      isSimulated: false,
      adminUserId: safdarjungAdmin.id,
    },
  });

  const apollo = await prisma.hospital.create({
    data: {
      name: 'Indraprastha Apollo Hospitals',
      registrationNo: 'PVT-DL-APL-101',
      type: 'PRIVATE',
      status: 'VERIFIED',
      address: 'Sarita Vihar, Delhi Mathura Road',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110076',
      latitude: 28.5367,
      longitude: 77.2882,
      phone: '011-71791090',
      emergencyPhone: '1066',
      email: 'assistance@apollohospitals.com',
      website: 'https://www.apollohospitals.com',
      isSimulated: false,
      adminUserId: apolloAdmin.id,
    },
  });

  const maxHospital = await prisma.hospital.create({
    data: {
      name: 'Max Super Speciality Hospital, Saket',
      registrationNo: 'PVT-DL-MAX-202',
      type: 'PRIVATE',
      status: 'VERIFIED',
      address: '1, 2, Press Enclave Marg, Saket',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110017',
      latitude: 28.5273,
      longitude: 77.2140,
      phone: '011-26515050',
      emergencyPhone: '011-40554055',
      email: 'saket@maxhealthcare.com',
      website: 'https://www.maxhealthcare.in',
      isSimulated: false,
      adminUserId: maxAdmin.id,
    },
  });

  // Pending verification hospital for SuperAdmin review testing
  const metroHospital = await prisma.hospital.create({
    data: {
      name: 'Metro City Multispeciality Clinic',
      registrationNo: 'PVT-DL-MTR-999',
      type: 'PRIVATE',
      status: 'PENDING_VERIFICATION',
      address: 'Sector 18, Near Metro Station',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
      latitude: 28.5708,
      longitude: 77.3261,
      phone: '0120-4567890',
      emergencyPhone: '0120-4567899',
      email: 'contact@metrocare.org',
      website: 'https://www.metrocare.org',
      isSimulated: false,
      adminUserId: pendingHospitalAdmin.id,
    },
  });

  // Explicit Simulated Facility for Academic Demo Testing
  const demoCHC = await prisma.hospital.create({
    data: {
      name: '[SIMULATED DATA] Central Model Community Health Centre',
      registrationNo: 'SIM-DL-CHC-999',
      type: 'GOVERNMENT',
      status: 'VERIFIED',
      address: 'Rajpath Demo Avenue, Central Secretariat',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      latitude: 28.6139,
      longitude: 77.2090,
      phone: '011-23000000',
      emergencyPhone: '011-23000001',
      email: 'demo@civicconnect.test',
      website: 'https://civicconnect.test/demo-facility',
      isSimulated: true, // Marked explicitly as simulated
      adminUserId: aiimsAdmin.id,
    },
  });

  // 5. Hospital Departments
  const deptAIIMS_Cardio = await prisma.hospitalDepartment.create({
    data: { hospitalId: aiims.id, name: 'Cardiology', description: 'Comprehensive cardiac care and intervention', headDoctor: 'Dr. Balram Airan' },
  });
  const deptAIIMS_General = await prisma.hospitalDepartment.create({
    data: { hospitalId: aiims.id, name: 'General Medicine', description: 'Primary and tertiary diagnostic care', headDoctor: 'Dr. Naveen Kumar' },
  });
  const deptAIIMS_Ortho = await prisma.hospitalDepartment.create({
    data: { hospitalId: aiims.id, name: 'Orthopedics & Joint Replacement', description: 'Trauma, sports injuries, and joint replacement', headDoctor: 'Dr. Rajesh Malhotra' },
  });
  const deptAIIMS_Emergency = await prisma.hospitalDepartment.create({
    data: { hospitalId: aiims.id, name: 'Emergency & Trauma Care', description: '24/7 Level-1 trauma response', headDoctor: 'Dr. Sanjeev Bhoi' },
  });

  const deptApollo_Cardio = await prisma.hospitalDepartment.create({
    data: { hospitalId: apollo.id, name: 'Cardiology & Cardiac Surgery', description: 'Advanced interventional cardiology and bypass', headDoctor: 'Dr. Naresh Trehan' },
  });
  const deptApollo_General = await prisma.hospitalDepartment.create({
    data: { hospitalId: apollo.id, name: 'Internal Medicine', description: 'Specialized adult illness management', headDoctor: 'Dr. S. K. Wangnoo' },
  });

  const deptMax_Neuro = await prisma.hospitalDepartment.create({
    data: { hospitalId: maxHospital.id, name: 'Neurology & Neurosurgery', description: 'Comprehensive brain and spine institute', headDoctor: 'Dr. P. N. Renjen' },
  });
  const deptMax_General = await prisma.hospitalDepartment.create({
    data: { hospitalId: maxHospital.id, name: 'General Medicine', description: 'Outpatient consultation and preventive wellness', headDoctor: 'Dr. Rommel Tickoo' },
  });

  // 6. Doctors & Users
  const docUser1 = await prisma.user.create({
    data: {
      name: 'Dr. Ananya Sharma',
      email: 'dr.sharma@aiims.edu',
      passwordHash: defaultPassword,
      phone: '+91 9811122233',
      role: 'DOCTOR',
    },
  });
  const doctor1 = await prisma.doctor.create({
    data: {
      userId: docUser1.id,
      hospitalId: aiims.id,
      departmentId: deptAIIMS_Cardio.id,
      specialization: 'Senior Interventional Cardiologist',
      qualification: 'MBBS, MD (Medicine), DM (Cardiology) - AIIMS',
      experienceYears: 16,
      consultationFee: 0.0, // Free at AIIMS
      isAvailable: true,
    },
  });

  const docUser2 = await prisma.user.create({
    data: {
      name: 'Dr. Vikram Malhotra',
      email: 'dr.malhotra@aiims.edu',
      passwordHash: defaultPassword,
      phone: '+91 9811133344',
      role: 'DOCTOR',
    },
  });
  const doctor2 = await prisma.doctor.create({
    data: {
      userId: docUser2.id,
      hospitalId: aiims.id,
      departmentId: deptAIIMS_General.id,
      specialization: 'Consultant Physician & Diabetologist',
      qualification: 'MBBS, MD (General Medicine)',
      experienceYears: 12,
      consultationFee: 0.0,
      isAvailable: true,
    },
  });

  const docUser3 = await prisma.user.create({
    data: {
      name: 'Dr. Priya Sengupta',
      email: 'dr.sengupta@apollohospitals.com',
      passwordHash: defaultPassword,
      phone: '+91 9811144455',
      role: 'DOCTOR',
    },
  });
  const doctor3 = await prisma.doctor.create({
    data: {
      userId: docUser3.id,
      hospitalId: apollo.id,
      departmentId: deptApollo_Cardio.id,
      specialization: 'Pediatric Cardiologist',
      qualification: 'MBBS, DNB (Pediatrics), FNB (Pediatric Cardiology)',
      experienceYears: 14,
      consultationFee: 1200.0,
      isAvailable: true,
    },
  });

  const docUser4 = await prisma.user.create({
    data: {
      name: 'Dr. Rohan Iyer',
      email: 'dr.iyer@maxhealthcare.com',
      passwordHash: defaultPassword,
      phone: '+91 9811155566',
      role: 'DOCTOR',
    },
  });
  const doctor4 = await prisma.doctor.create({
    data: {
      userId: docUser4.id,
      hospitalId: maxHospital.id,
      departmentId: deptMax_General.id,
      specialization: 'Senior Consultant Internal Medicine',
      qualification: 'MBBS, MD (Medicine), MRCP (UK)',
      experienceYears: 18,
      consultationFee: 1500.0,
      isAvailable: true,
    },
  });

  // Doctor Schedules (Monday to Friday, 09:00 - 13:00, 15 min slots)
  const doctors = [doctor1, doctor2, doctor3, doctor4];
  for (const doc of doctors) {
    for (let day = 1; day <= 5; day++) { // Mon - Fri
      await prisma.doctorSchedule.create({
        data: {
          doctorId: doc.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '13:00',
          slotDurationMins: 15,
          maxPatients: 16,
        },
      });
    }
  }

  // 7. Hospital Beds
  const hospitals = [aiims, safdarjung, apollo, maxHospital, demoCHC];
  for (const hosp of hospitals) {
    await prisma.hospitalBed.createMany({
      data: [
        { hospitalId: hosp.id, category: 'GENERAL', totalBeds: 250, occupiedBeds: 195, availableBeds: 55 },
        { hospitalId: hosp.id, category: 'ICU', totalBeds: 45, occupiedBeds: 36, availableBeds: 9 },
        { hospitalId: hosp.id, category: 'EMERGENCY', totalBeds: 30, occupiedBeds: 21, availableBeds: 9 },
        { hospitalId: hosp.id, category: 'OXYGEN', totalBeds: 60, occupiedBeds: 38, availableBeds: 22 },
        { hospitalId: hosp.id, category: 'PEDIATRIC', totalBeds: 35, occupiedBeds: 18, availableBeds: 17 },
      ],
    });
  }

  // 8. Blood Banks & Blood Inventory
  const bloodBankAdmin = await prisma.user.create({
    data: {
      name: 'Red Cross Blood Bank Coordinator',
      email: 'bloodbank@redcrossdelhi.org',
      passwordHash: defaultPassword,
      phone: '+91 11 23716441',
      role: 'BLOOD_BANK_ADMIN',
    },
  });

  const bloodBank = await prisma.bloodBank.create({
    data: {
      name: 'Indian Red Cross Society National Blood Bank',
      licenseNo: 'DL-BB-IRC-1002',
      address: '1, Red Cross Road, Near Parliament House',
      city: 'New Delhi',
      phone: '011-23716441',
      latitude: 28.6219,
      longitude: 77.2104,
      isSimulated: false,
      adminUserId: bloodBankAdmin.id,
    },
  });

  const bloodGroups = [
    { group: 'A_POSITIVE', units: 42 },
    { group: 'A_NEGATIVE', units: 14 },
    { group: 'B_POSITIVE', units: 58 },
    { group: 'B_NEGATIVE', units: 18 },
    { group: 'AB_POSITIVE', units: 25 },
    { group: 'AB_NEGATIVE', units: 9 },
    { group: 'O_POSITIVE', units: 64 },
    { group: 'O_NEGATIVE', units: 16 },
  ];

  for (const bg of bloodGroups) {
    await prisma.bloodInventory.create({
      data: {
        bloodBankId: bloodBank.id,
        bloodGroup: bg.group,
        unitsAvailable: bg.units,
      },
    });
  }

  // 9. Pharmacies & Inventories
  const pharmacyAdmin = await prisma.user.create({
    data: {
      name: 'Apollo 247 Pharmacy Chief Pharmacist',
      email: 'pharmacy@apollopharmacy.in',
      passwordHash: defaultPassword,
      phone: '+91 11 26851234',
      role: 'PHARMACY_ADMIN',
    },
  });

  const pharmacy = await prisma.pharmacy.create({
    data: {
      hospitalId: apollo.id,
      name: 'Apollo 24x7 In-House Pharmacy',
      licenseNo: 'DL-PH-APL-5421',
      address: 'Ground Floor, Indraprastha Apollo Hospitals, Sarita Vihar',
      city: 'New Delhi',
      phone: '011-26851234',
      latitude: 28.5367,
      longitude: 77.2882,
      isSimulated: false,
      adminUserId: pharmacyAdmin.id,
    },
  });

  const medicines = [
    { name: 'Paracetamol 650mg (Dolo 650)', category: 'Analgesics / Fever', stock: 450, price: 32.5, batch: 'DL-2026-A1' },
    { name: 'Amoxicillin & Potassium Clavulanate 625mg (Augmentin)', category: 'Antibiotics', stock: 180, price: 185.0, batch: 'AUG-9821' },
    { name: 'Metformin Hydrochloride 500mg (Glycomet)', category: 'Antidiabetic', stock: 320, price: 42.0, batch: 'GLY-4412' },
    { name: 'Atorvastatin 10mg (Atorva)', category: 'Cardiovascular', stock: 210, price: 120.0, batch: 'ATV-3310' },
    { name: 'Azithromycin 500mg (Azee 500)', category: 'Antibiotics', stock: 140, price: 115.0, batch: 'AZ-7721' },
    { name: 'Cetirizine 10mg (Cetzine)', category: 'Antihistamines', stock: 500, price: 22.0, batch: 'CTZ-901' },
    { name: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal', stock: 380, price: 95.0, batch: 'PAN-1123' },
    { name: 'Oral Rehydration Salts (ORS Electral sachet)', category: 'Electrolytes', stock: 600, price: 21.5, batch: 'ORS-554' },
  ];

  for (const med of medicines) {
    await prisma.pharmacyInventory.create({
      data: {
        pharmacyId: pharmacy.id,
        medicineName: med.name,
        category: med.category,
        stockQuantity: med.stock,
        unitPrice: med.price,
        batchNo: med.batch,
        expiryDate: new Date('2028-12-31'),
      },
    });
  }

  // 10. Ambulance Providers
  const ambulanceUser = await prisma.user.create({
    data: {
      name: 'Ramesh Emergency Pilot',
      email: 'ramesh.ambulance@delhiems.org',
      passwordHash: defaultPassword,
      phone: '+91 9876543210',
      role: 'AMBULANCE_PROVIDER',
    },
  });

  const ambulanceProvider = await prisma.ambulanceProvider.create({
    data: {
      userId: ambulanceUser.id,
      serviceName: 'CATS Delhi Emergency Mobile Unit 102',
      vehicleNo: 'DL-1T-AA-1022',
      vehicleType: 'ADVANCED_ICU',
      phone: '+91 9876543210',
      isAvailable: true,
      currentLat: 28.5672,
      currentLng: 77.2100,
    },
  });

  // 11. Citizens & Patients
  const citizen1 = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'rahul.citizen@gmail.com',
      passwordHash: defaultPassword,
      phone: '+91 9899012345',
      role: 'CITIZEN',
    },
  });

  await prisma.patientProfile.create({
    data: {
      userId: citizen1.id,
      gender: 'Male',
      dob: new Date('1994-06-15'),
      bloodGroup: 'B+',
      emergencyContactName: 'Sunita Sharma (Mother)',
      emergencyContactPhone: '+91 9899099999',
      allergies: 'Penicillin, Dust Mites',
      chronicConditions: 'Mild Hypertension',
      address: 'House No 42, Block C, Green Park Extension',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110016',
    },
  });

  const citizen2 = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'priya.patient@gmail.com',
      passwordHash: defaultPassword,
      phone: '+91 9899054321',
      role: 'CITIZEN',
    },
  });

  await prisma.patientProfile.create({
    data: {
      userId: citizen2.id,
      gender: 'Female',
      dob: new Date('1998-03-22'),
      bloodGroup: 'O+',
      emergencyContactName: 'Kishore Patel (Father)',
      emergencyContactPhone: '+91 9899088888',
      allergies: 'None',
      chronicConditions: 'None',
      address: 'Tower 4, Apt 602, Sarita Vihar',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110076',
    },
  });

  // 12. Sample Appointments
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.appointment.create({
    data: {
      appointmentNo: 'APT-2026-AIIMS-1001',
      patientUserId: citizen1.id,
      doctorId: doctor1.id,
      hospitalId: aiims.id,
      appointmentDate: tomorrow,
      timeSlot: '09:30',
      status: 'PENDING',
      symptoms: 'Mild chest heaviness after brisk walking, occasional palpitation.',
    },
  });

  await prisma.appointment.create({
    data: {
      appointmentNo: 'APT-2026-APL-1002',
      patientUserId: citizen2.id,
      doctorId: doctor3.id,
      hospitalId: apollo.id,
      appointmentDate: tomorrow,
      timeSlot: '10:00',
      status: 'ACCEPTED',
      symptoms: 'Routine post-surgery cardiac pediatric follow up.',
      actionByUserId: docUser3.id,
    },
  });

  // 13. Sample Emergency Registration
  await prisma.emergencyRegistration.create({
    data: {
      emergencyNo: 'EMG-2026-AIIMS-901',
      patientName: 'Kishan Lal',
      patientPhone: '+91 9810011223',
      age: 58,
      emergencyType: 'Acute Chest Pain / Suspected STEMI',
      triagePriority: 'CRITICAL',
      description: 'Severe radiating substernal pain, profuse sweating, BP 160/100.',
      hospitalId: aiims.id,
      status: 'TRIAGED',
      emergencyContactName: 'Mahesh Lal (Son)',
      emergencyContactPhone: '+91 9810099887',
      latitude: 28.5672,
      longitude: 77.2100,
    },
  });

  // 14. Sample Medical Records & Prescriptions
  const record1 = await prisma.patientMedicalRecord.create({
    data: {
      patientUserId: citizen1.id,
      doctorId: doctor2.id,
      hospitalId: aiims.id,
      visitDate: new Date('2026-10-15'),
      diagnosis: 'Essential Stage-1 Hypertension with seasonal allergic rhinitis.',
      clinicalNotes: 'Blood pressure recorded at 138/88 mmHg. Advised low sodium diet and regular morning walk.',
      followUpDate: new Date('2026-11-15'),
    },
  });

  const presc1 = await prisma.prescription.create({
    data: {
      medicalRecordId: record1.id,
      doctorId: doctor2.id,
      patientUserId: citizen1.id,
      notes: 'Take tablets after breakfast with water. Avoid sudden cessation.',
    },
  });

  await prisma.prescriptionItem.createMany({
    data: [
      { prescriptionId: presc1.id, medicineName: 'Telmisartan 40mg', dosage: '40mg', frequency: '1-0-0 (Morning)', durationDays: 30, instructions: 'After breakfast' },
      { prescriptionId: presc1.id, medicineName: 'Cetirizine 10mg', dosage: '10mg', frequency: '0-0-1 (Night)', durationDays: 7, instructions: 'If sneezing occurs' },
    ],
  });

  // 15. Sample Ambulance Request
  await prisma.ambulanceRequest.create({
    data: {
      requestNo: 'AMB-2026-DL-501',
      citizenUserId: citizen1.id,
      providerId: ambulanceProvider.id,
      patientName: 'Rahul Sharma',
      patientPhone: '+91 9899012345',
      pickupAddress: 'Block C, Green Park Extension, New Delhi',
      pickupLat: 28.5583,
      pickupLng: 77.2025,
      destinationHospitalId: aiims.id,
      emergencyDetails: 'Sudden shortness of breath, needs immediate oxygen transit.',
      status: 'ACCEPTED',
    },
  });

  // 16. Civic Complaints
  await prisma.civicComplaint.createMany({
    data: [
      {
        citizenUserId: citizen1.id,
        category: 'SANITATION',
        title: 'Overflowing Sewage Drain near Community Park',
        description: 'Severe sewage overflow generating foul odor and mosquito breeding ground near Block C Green Park.',
        locationAddress: 'Lane 4, Near Children Park, Green Park Extension',
        latitude: 28.5580,
        longitude: 77.2030,
        status: 'IN_PROGRESS',
        assignedAuthorityId: municipalAuthority.id,
        resolutionNotes: 'Dispatched sanitation inspection team to clear blocked drainage pipeline.',
      },
      {
        citizenUserId: citizen2.id,
        category: 'PUBLIC_HEALTH',
        title: 'Uncollected Medical Waste in Alleyway',
        description: 'Bio-waste bags left unattended outside local diagnostic center for 3 days.',
        locationAddress: 'Market Road, Sarita Vihar Block B',
        latitude: 28.5370,
        longitude: 77.2890,
        status: 'PENDING',
      },
    ],
  });

  // 17. Government Welfare Schemes
  await prisma.welfareScheme.createMany({
    data: [
      {
        name: 'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
        category: 'Central Government Health Insurance',
        description: 'World’s largest government-funded healthcare assurance scheme providing financial protection of up to ₹5 lakh per family per year for secondary and tertiary care hospitalization.',
        eligibility: 'Deprived rural families and identified occupational categories of urban workers families based on SECC 2011 data.',
        benefits: 'Cashless and paperless access to services at all empaneled public and private network hospitals across India.',
        documentsRequired: 'Aadhaar Card, Ration Card, PM-JAY Family ID or Letter.',
        officialPortalUrl: 'https://pmjay.gov.in',
        isActive: true,
      },
      {
        name: 'Central Government Health Scheme (CGHS)',
        category: 'Central Government Healthcare',
        description: 'Comprehensive health care facilities for Central Government employees, pensioners, and their dependents residing in CGHS covered cities.',
        eligibility: 'Central Government employees, pensioners, sitting and ex-Members of Parliament, freedom fighters.',
        benefits: 'Outpatient care, indoor treatment at government and empaneled private hospitals, specialist consultations, and free medicines.',
        documentsRequired: 'CGHS Plastic Beneficiary Card, Identity Proof, Pension/Employment Verification.',
        officialPortalUrl: 'https://cghs.nic.in',
        isActive: true,
      },
      {
        name: 'Rashtriya Arogya Nidhi (RAN)',
        category: 'Financial Assistance for Life-Threatening Diseases',
        description: 'Provides financial assistance to poor patients living below poverty line who are suffering from major life-threatening diseases to receive medical treatment at government super-speciality hospitals.',
        eligibility: 'Patients with family income below the state poverty line threshold receiving treatment at designated premier government hospitals.',
        benefits: 'One-time financial assistance of up to ₹15 Lakhs for critical surgeries and interventions.',
        documentsRequired: 'BPL Card, Income Certificate, Hospital Treatment Estimate and Medical Certificate.',
        officialPortalUrl: 'https://main.mohfw.gov.in',
        isActive: true,
      },
      {
        name: 'Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)',
        category: 'Maternal Healthcare',
        description: 'Provides guaranteed, comprehensive and quality antenatal care, free of cost, to all pregnant women on the 9th of every month.',
        eligibility: 'All pregnant women in their 2nd or 3rd trimesters.',
        benefits: 'Free antenatal checkup, ultrasound scans, blood tests, and iron-folic acid supplementation by OBGYN specialists.',
        documentsRequired: 'Mother and Child Protection (MCP) Card, Aadhaar Card.',
        officialPortalUrl: 'https://pmsma.nhp.gov.in',
        isActive: true,
      },
    ],
  });

  // 18. Reviews
  await prisma.hospitalReview.create({
    data: {
      hospitalId: aiims.id,
      userId: citizen1.id,
      rating: 5,
      comment: 'World-class doctors and outstanding emergency response. Although OPD wait time is high, the clinical expertise is unmatched.',
      isVerifiedVisit: true,
    },
  });

  await prisma.hospitalReview.create({
    data: {
      hospitalId: apollo.id,
      userId: citizen2.id,
      rating: 4,
      comment: 'Very clean facility, prompt appointment adherence, and polite nursing staff. Consultation fee is slightly premium.',
      isVerifiedVisit: true,
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('--- DEFAULT DEMO CREDENTIALS ---');
  console.log('Super Admin:       admin@civicconnect.gov.in       / Admin@123456');
  console.log('AIIMS Admin:       admin@aiims.edu                 / Password@123');
  console.log('Apollo Admin:      admin@apollohospitals.com       / Password@123');
  console.log('Max Admin:         admin@maxhealthcare.com         / Password@123');
  console.log('Doctor (AIIMS):    dr.sharma@aiims.edu             / Password@123');
  console.log('Citizen:           rahul.citizen@gmail.com         / Password@123');
  console.log('Ambulance Driver:  ramesh.ambulance@delhiems.org   / Password@123');
  console.log('Blood Bank Admin:  bloodbank@redcrossdelhi.org     / Password@123');
  console.log('Pharmacy Admin:    pharmacy@apollopharmacy.in      / Password@123');
  console.log('Authority:         authority@mcd.gov.in            / Password@123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
