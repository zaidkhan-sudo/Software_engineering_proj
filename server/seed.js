const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Safety check: Never run seed in production
if (process.env.NODE_ENV === 'production') {
  console.error('CRITICAL: seed.js refused to execute in production environment (NODE_ENV=production).');
  process.exit(1);
}

const User = require('./models/User');
const Department = require('./models/Department');
const Counter = require('./models/Counter');
const { ROLES } = require('./utils/constants');

async function seed() {
  console.log('--- Starting Database Seed (Dev Environment) ---');

  if (!process.env.MONGO_URI) {
    console.error('Error: MONGO_URI is missing from environment.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  // Wipe development collections owned by this seed
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Counter.deleteMany({})
  ]);
  console.log('Wiped existing Users, Departments, and Counters.');

  // 1. Create Departments
  const departmentsData = [
    {
      name: 'Roads & Infrastructure',
      description: 'Handles roads, bridges, potholes, footpaths, and streetlights',
      categoriesHandled: ['Roads', 'Streetlights'],
      isActive: true
    },
    {
      name: 'Water Supply',
      description: 'Handles municipal water supply, pipeline leaks, and drainage',
      categoriesHandled: ['Water Supply', 'Drainage'],
      isActive: true
    },
    {
      name: 'Sanitation',
      description: 'Handles garbage collection, waste management, and public hygiene',
      categoriesHandled: ['Garbage', 'Sanitation'],
      isActive: true
    },
    {
      name: 'Electricity',
      description: 'Handles power outages, electrical poles, and transformers',
      categoriesHandled: ['Electricity'],
      isActive: true
    }
  ];

  const createdDepartments = await Department.insertMany(departmentsData);
  console.log(`Created ${createdDepartments.length} departments.`);

  const deptMap = {};
  createdDepartments.forEach((dept) => {
    deptMap[dept.name] = dept._id;
  });

  // 2. Prepare Passwords
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const officerPasswordHash = await bcrypt.hash('officer123', 10);
  const citizenPasswordHash = await bcrypt.hash('citizen123', 10);

  // 3. Create Users
  const usersData = [
    // Admin
    {
      name: 'System Admin',
      email: 'admin@grievance.local',
      passwordHash: adminPasswordHash,
      role: ROLES.ADMIN,
      phone: '9876543210',
      isActive: true
    },
    // Officers (one per department)
    {
      name: 'Ramesh Sharma (Roads Officer)',
      email: 'officer.roads@grievance.local',
      passwordHash: officerPasswordHash,
      role: ROLES.OFFICER,
      department: deptMap['Roads & Infrastructure'],
      phone: '9876543211',
      isActive: true
    },
    {
      name: 'Priya Patel (Water Officer)',
      email: 'officer.water@grievance.local',
      passwordHash: officerPasswordHash,
      role: ROLES.OFFICER,
      department: deptMap['Water Supply'],
      phone: '9876543212',
      isActive: true
    },
    {
      name: 'Suresh Verma (Sanitation Officer)',
      email: 'officer.sanitation@grievance.local',
      passwordHash: officerPasswordHash,
      role: ROLES.OFFICER,
      department: deptMap['Sanitation'],
      phone: '9876543213',
      isActive: true
    },
    {
      name: 'Anjali Gupta (Electricity Officer)',
      email: 'officer.electricity@grievance.local',
      passwordHash: officerPasswordHash,
      role: ROLES.OFFICER,
      department: deptMap['Electricity'],
      phone: '9876543214',
      isActive: true
    },
    // Citizens
    {
      name: 'Amit Kumar',
      email: 'citizen1@grievance.local',
      passwordHash: citizenPasswordHash,
      role: ROLES.CITIZEN,
      phone: '9876543220',
      isActive: true
    },
    {
      name: 'Sneha Roy',
      email: 'citizen2@grievance.local',
      passwordHash: citizenPasswordHash,
      role: ROLES.CITIZEN,
      phone: '9876543221',
      isActive: true
    }
  ];

  const createdUsers = await User.insertMany(usersData);
  console.log(`Created ${createdUsers.length} users:`);
  createdUsers.forEach((u) => {
    console.log(` - [${u.role.toUpperCase()}] ${u.name} <${u.email}>`);
  });

  console.log('\n--- Seed Complete ---');
  console.log('Credentials Summary:');
  console.log(' Admin:   admin@grievance.local / admin123');
  console.log(' Officer: officer.roads@grievance.local / officer123');
  console.log(' Citizen: citizen1@grievance.local / citizen123');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

seed().catch((err) => {
  console.error('Seed script error:', err);
  process.exit(1);
});
