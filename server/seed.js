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
const Grievance = require('./models/Grievance');
const StatusHistory = require('./models/StatusHistory');
const Comment = require('./models/Comment');
const Counter = require('./models/Counter');
const { ROLES, STATUSES, PRIORITIES } = require('./utils/constants');

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
    Grievance.deleteMany({}),
    StatusHistory.deleteMany({}),
    Comment.deleteMany({}),
    Counter.deleteMany({})
  ]);
  console.log('Wiped existing Users, Departments, Grievances, StatusHistory, Comments, and Counters.');

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
  console.log(`Created ${createdUsers.length} users.`);

  const userMap = {};
  createdUsers.forEach((u) => {
    userMap[u.email] = u._id;
  });

  // 4. Create 9 Sample Grievances with consistent history and comments
  const year = new Date().getFullYear();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const grievancesData = [
    // 1. RESOLVED Roads grievance with 5-star feedback
    {
      trackingId: `GRV-${year}-000001`,
      title: 'Deep potholes on MG Road near City Hospital',
      description: 'Multiple dangerous potholes causing severe traffic jams and damage to ambulances',
      category: 'Roads',
      priority: PRIORITIES.HIGH,
      location: 'MG Road, Opposite Emergency Ward, Ward 5',
      status: STATUSES.RESOLVED,
      citizen: userMap['citizen1@grievance.local'],
      department: deptMap['Roads & Infrastructure'],
      assignedOfficer: userMap['officer.roads@grievance.local'],
      resolvedAt: new Date(now - 1 * dayMs),
      feedback: {
        rating: 5,
        comment: 'Potholes repaired with asphalt within 48 hours. Excellent work!'
      },
      createdAt: new Date(now - 4 * dayMs)
    },
    // 2. IN_PROGRESS Streetlight grievance
    {
      trackingId: `GRV-${year}-000002`,
      title: 'Flickering streetlights outside Model High School',
      description: 'Three continuous sodium lamps are dark, creating unsafe walk for students in evening',
      category: 'Streetlights',
      priority: PRIORITIES.MEDIUM,
      location: 'Model School Lane, Sector 14',
      status: STATUSES.IN_PROGRESS,
      citizen: userMap['citizen2@grievance.local'],
      department: deptMap['Roads & Infrastructure'],
      assignedOfficer: userMap['officer.roads@grievance.local'],
      createdAt: new Date(now - 3 * dayMs)
    },
    // 3. UNDER_REVIEW Water grievance
    {
      trackingId: `GRV-${year}-000003`,
      title: 'Contaminated muddy water in residential taps',
      description: 'Tap water is visibly brown and smells foul since yesterday morning',
      category: 'Water Supply',
      priority: PRIORITIES.URGENT,
      location: 'Pocket B, Green Park Apartments',
      status: STATUSES.UNDER_REVIEW,
      citizen: userMap['citizen1@grievance.local'],
      department: deptMap['Water Supply'],
      assignedOfficer: userMap['officer.water@grievance.local'],
      createdAt: new Date(now - 2 * dayMs)
    },
    // 4. SUBMITTED Drainage grievance
    {
      trackingId: `GRV-${year}-000004`,
      title: 'Blocked drainage overflow on Vegetable Market Road',
      description: 'Rainwater drain is clogged with plastic waste and stagnant water is entering shops',
      category: 'Drainage',
      priority: PRIORITIES.HIGH,
      location: 'Vegetable Market Road, Ward 11',
      status: STATUSES.SUBMITTED,
      citizen: userMap['citizen2@grievance.local'],
      department: deptMap['Water Supply'],
      assignedOfficer: null,
      createdAt: new Date(now - 1 * dayMs)
    },
    // 5. RESOLVED Garbage grievance with 4-star feedback
    {
      trackingId: `GRV-${year}-000005`,
      title: 'Overflowing community garbage dump not cleared for 5 days',
      description: 'Solid waste is spilling onto the pedestrian pathway attracting stray animals',
      category: 'Garbage',
      priority: PRIORITIES.MEDIUM,
      location: 'Corner of Lane 3, Sector 8',
      status: STATUSES.RESOLVED,
      citizen: userMap['citizen1@grievance.local'],
      department: deptMap['Sanitation'],
      assignedOfficer: userMap['officer.sanitation@grievance.local'],
      resolvedAt: new Date(now - 1 * dayMs),
      feedback: {
        rating: 4,
        comment: 'Waste cleared cleanly by the sanitation truck'
      },
      createdAt: new Date(now - 5 * dayMs)
    },
    // 6. REOPENED Sanitation grievance (resolved then citizen reopened once)
    {
      trackingId: `GRV-${year}-000006`,
      title: 'Dead animal carcass unattended near children park',
      description: 'Immediate disposal required due to health hazards and severe stench',
      category: 'Sanitation',
      priority: PRIORITIES.URGENT,
      location: 'Children Park Gate 2, Ward 3',
      status: STATUSES.REOPENED,
      citizen: userMap['citizen2@grievance.local'],
      department: deptMap['Sanitation'],
      assignedOfficer: userMap['officer.sanitation@grievance.local'],
      reopenCount: 1,
      resolvedAt: null,
      createdAt: new Date(now - 3 * dayMs)
    },
    // 7. IN_PROGRESS Electricity grievance
    {
      trackingId: `GRV-${year}-000007`,
      title: 'Sparking electric transformer pole near bus stop',
      description: 'Frequent sparks and loud humming noise from the 11kV transformer',
      category: 'Electricity',
      priority: PRIORITIES.URGENT,
      location: 'Central Bus Stand, Sector 1',
      status: STATUSES.IN_PROGRESS,
      citizen: userMap['citizen1@grievance.local'],
      department: deptMap['Electricity'],
      assignedOfficer: userMap['officer.electricity@grievance.local'],
      createdAt: new Date(now - 2 * dayMs)
    },
    // 8. REJECTED Streetlight grievance
    {
      trackingId: `GRV-${year}-000008`,
      title: 'Installation request for private backyard floodlight',
      description: 'Citizen requesting municipal electric pole inside private farmhouse boundary',
      category: 'Streetlights',
      priority: PRIORITIES.LOW,
      location: 'Farmhouse 12, Outer Ring Road',
      status: STATUSES.REJECTED,
      citizen: userMap['citizen2@grievance.local'],
      department: deptMap['Roads & Infrastructure'],
      assignedOfficer: userMap['officer.roads@grievance.local'],
      createdAt: new Date(now - 6 * dayMs)
    },
    // 9. SUBMITTED Water grievance
    {
      trackingId: `GRV-${year}-000009`,
      title: 'Low pipeline water pressure on upper floors',
      description: 'Water pressure drops to a trickle between 6 AM and 8 AM daily',
      category: 'Water Supply',
      priority: PRIORITIES.MEDIUM,
      location: 'Housing Board Colony, 3rd Floor, Ward 9',
      status: STATUSES.SUBMITTED,
      citizen: userMap['citizen1@grievance.local'],
      department: deptMap['Water Supply'],
      assignedOfficer: null,
      createdAt: new Date(now - 12 * 60 * 60 * 1000)
    }
  ];

  const createdGrievances = await Grievance.insertMany(grievancesData);
  console.log(`Created ${createdGrievances.length} grievances.`);

  // 5. Create StatusHistory entries matching transitions
  const historyEntries = [];

  createdGrievances.forEach((g) => {
    // Initial submission entry for all
    historyEntries.push({
      grievance: g._id,
      fromStatus: null,
      toStatus: STATUSES.SUBMITTED,
      changedBy: g.citizen,
      remark: 'Grievance filed by citizen',
      timestamp: new Date(g.createdAt)
    });

    if (g.status === STATUSES.UNDER_REVIEW) {
      historyEntries.push({
        grievance: g._id,
        fromStatus: STATUSES.SUBMITTED,
        toStatus: STATUSES.UNDER_REVIEW,
        changedBy: g.assignedOfficer,
        remark: 'Complaint reviewed and assigned to junior engineer for inspection',
        timestamp: new Date(g.createdAt.getTime() + 4 * 3600 * 1000)
      });
    } else if (g.status === STATUSES.IN_PROGRESS) {
      historyEntries.push({
        grievance: g._id,
        fromStatus: STATUSES.SUBMITTED,
        toStatus: STATUSES.UNDER_REVIEW,
        changedBy: g.assignedOfficer,
        remark: 'Under review by field officer',
        timestamp: new Date(g.createdAt.getTime() + 4 * 3600 * 1000)
      });
      historyEntries.push({
        grievance: g._id,
        fromStatus: STATUSES.UNDER_REVIEW,
        toStatus: STATUSES.IN_PROGRESS,
        changedBy: g.assignedOfficer,
        remark: 'Field team dispatched with equipment for rectification',
        timestamp: new Date(g.createdAt.getTime() + 8 * 3600 * 1000)
      });
    } else if (g.status === STATUSES.RESOLVED) {
      historyEntries.push({
        grievance: g._id,
        fromStatus: STATUSES.SUBMITTED,
        toStatus: STATUSES.UNDER_REVIEW,
        changedBy: g.assignedOfficer,
        remark: 'Under review by maintenance team',
        timestamp: new Date(g.createdAt.getTime() + 3 * 3600 * 1000)
      });
      historyEntries.push({
        grievance: g._id,
        fromStatus: STATUSES.UNDER_REVIEW,
        toStatus: STATUSES.IN_PROGRESS,
        changedBy: g.assignedOfficer,
        remark: 'Work commenced on site',
        timestamp: new Date(g.createdAt.getTime() + 8 * 3600 * 1000)
      });
      historyEntries.push({
        grievance: g._id,
        fromStatus: STATUSES.IN_PROGRESS,
        toStatus: STATUSES.RESOLVED,
        changedBy: g.assignedOfficer,
        remark: 'Repair completed and verified on site',
        timestamp: new Date(g.resolvedAt)
      });
    } else if (g.status === STATUSES.REJECTED) {
      historyEntries.push({
        grievance: g._id,
        fromStatus: STATUSES.SUBMITTED,
        toStatus: STATUSES.UNDER_REVIEW,
        changedBy: g.assignedOfficer,
        remark: 'Under administrative scrutiny',
        timestamp: new Date(g.createdAt.getTime() + 6 * 3600 * 1000)
      });
      historyEntries.push({
        grievance: g._id,
        fromStatus: STATUSES.UNDER_REVIEW,
        toStatus: STATUSES.REJECTED,
        changedBy: g.assignedOfficer,
        remark: 'Private property outside municipal jurisdiction',
        timestamp: new Date(g.createdAt.getTime() + 18 * 3600 * 1000)
      });
    } else if (g.status === STATUSES.REOPENED) {
      historyEntries.push({
        grievance: g._id,
        fromStatus: STATUSES.SUBMITTED,
        toStatus: STATUSES.UNDER_REVIEW,
        changedBy: g.assignedOfficer,
        remark: 'Reviewed by sanitary inspector',
        timestamp: new Date(g.createdAt.getTime() + 2 * 3600 * 1000)
      });
      historyEntries.push({
        grievance: g._id,
        fromStatus: STATUSES.UNDER_REVIEW,
        toStatus: STATUSES.IN_PROGRESS,
        changedBy: g.assignedOfficer,
        remark: 'Sanitation van deployed',
        timestamp: new Date(g.createdAt.getTime() + 6 * 3600 * 1000)
      });
      historyEntries.push({
        grievance: g._id,
        fromStatus: STATUSES.IN_PROGRESS,
        toStatus: STATUSES.RESOLVED,
        changedBy: g.assignedOfficer,
        remark: 'Reported cleaned',
        timestamp: new Date(g.createdAt.getTime() + 12 * 3600 * 1000)
      });
      historyEntries.push({
        grievance: g._id,
        fromStatus: STATUSES.RESOLVED,
        toStatus: STATUSES.REOPENED,
        changedBy: g.citizen,
        remark: 'Disposal was incomplete; foul smell remains around park benches',
        timestamp: new Date(g.createdAt.getTime() + 20 * 3600 * 1000)
      });
    }
  });

  await StatusHistory.insertMany(historyEntries);
  console.log(`Created ${historyEntries.length} audit StatusHistory entries.`);

  // 6. Create sample comments (public and internal)
  const sampleComments = [
    {
      grievance: createdGrievances[0]._id, // Potholes
      author: userMap['officer.roads@grievance.local'],
      text: 'Road roller and hot asphalt mix dispatched at 9:30 AM',
      isInternal: true,
      timestamp: new Date(now - 3 * dayMs)
    },
    {
      grievance: createdGrievances[0]._id,
      author: userMap['citizen1@grievance.local'],
      text: 'Thank you, road workers have arrived and blocked off traffic for repair.',
      isInternal: false,
      timestamp: new Date(now - 2 * dayMs)
    },
    {
      grievance: createdGrievances[2]._id, // Water
      author: userMap['officer.water@grievance.local'],
      text: 'Water testing kit results pending from central lab',
      isInternal: true,
      timestamp: new Date(now - 1 * dayMs)
    }
  ];

  await Comment.insertMany(sampleComments);
  console.log(`Created ${sampleComments.length} sample comments.`);

  // 7. Initialize Counter so next generated tracking ID is GRV-YYYY-000010
  await Counter.create({
    _id: `grievance_${year}`,
    seq: 9
  });
  console.log(`Initialized tracking ID counter sequence to 9.`);

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
