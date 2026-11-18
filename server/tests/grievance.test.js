const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Department = require('../models/Department');
const Grievance = require('../models/Grievance');
const StatusHistory = require('../models/StatusHistory');
const { runEscalation } = require('../jobs/escalation');
const jwt = require('jsonwebtoken');
const { ROLES, STATUSES, PRIORITIES } = require('../utils/constants');

function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

describe('Grievance Lifecycle & Security Tests (TC-05 to TC-18)', () => {
  let adminToken, officerRoadsToken, officerWaterToken, citizenToken, citizen2Token;
  let roadsDept, waterDept;
  let citizenUser, citizen2User, roadsOfficer, adminUser;

  beforeEach(async () => {
    // 1. Create departments
    roadsDept = await Department.create({
      name: 'Roads & Infrastructure',
      description: 'Roads maintenance',
      categoriesHandled: ['Roads', 'Streetlights'],
      isActive: true
    });

    waterDept = await Department.create({
      name: 'Water Supply',
      description: 'Water maintenance',
      categoriesHandled: ['Water Supply', 'Drainage'],
      isActive: true
    });

    // 2. Create users
    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@grievance.local',
      passwordHash: 'hashed_admin',
      role: ROLES.ADMIN,
      isActive: true
    });

    roadsOfficer = await User.create({
      name: 'Roads Officer',
      email: 'officer.roads@grievance.local',
      passwordHash: 'hashed_officer',
      role: ROLES.OFFICER,
      department: roadsDept._id,
      isActive: true
    });

    const waterOfficer = await User.create({
      name: 'Water Officer',
      email: 'officer.water@grievance.local',
      passwordHash: 'hashed_officer',
      role: ROLES.OFFICER,
      department: waterDept._id,
      isActive: true
    });

    citizenUser = await User.create({
      name: 'Citizen One',
      email: 'citizen1@grievance.local',
      passwordHash: 'hashed_citizen',
      role: ROLES.CITIZEN,
      isActive: true
    });

    citizen2User = await User.create({
      name: 'Citizen Two',
      email: 'citizen2@grievance.local',
      passwordHash: 'hashed_citizen',
      role: ROLES.CITIZEN,
      isActive: true
    });

    // Generate tokens
    adminToken = generateToken(adminUser);
    officerRoadsToken = generateToken(roadsOfficer);
    officerWaterToken = generateToken(waterOfficer);
    citizenToken = generateToken(citizenUser);
    citizen2Token = generateToken(citizen2User);
  });

  test('TC-05: Citizen files grievance with all fields and 1 image -> 201, tracking ID, auto-assigned department', async () => {
    const dummyImage = Buffer.from('fake-jpeg-image-bytes');

    const res = await request(app)
      .post('/api/v1/grievances')
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('title', 'Deep potholes on Main Avenue')
      .field('description', 'Multiple hazardous potholes causing severe disruption and vehicle damage.')
      .field('category', 'Roads')
      .field('priority', 'high')
      .field('location', 'Main Avenue near Civic Center')
      .attach('attachments', dummyImage, { filename: 'pothole.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.grievance).toBeDefined();
    expect(res.body.data.grievance.trackingId).toMatch(/^GRV-\d{4}-\d{6}$/);
    expect(res.body.data.grievance.status).toBe(STATUSES.SUBMITTED);
    expect(res.body.data.grievance.department.toString()).toBe(roadsDept._id.toString());
    expect(res.body.data.grievance.attachments).toHaveLength(1);
    expect(res.body.data.grievance.attachments[0].filename).toBe('pothole.jpg');
    expect(res.body.data.grievance.attachments[0].data).toBeUndefined(); // Stripped

    // Initial StatusHistory created
    const history = await StatusHistory.findOne({ grievance: res.body.data.grievance._id });
    expect(history).not.toBeNull();
    expect(history.fromStatus).toBeNull();
    expect(history.toStatus).toBe(STATUSES.SUBMITTED);
  });

  test('TC-06: File grievance without JWT -> 401, "Not authenticated"', async () => {
    const res = await request(app)
      .post('/api/v1/grievances')
      .field('title', 'Unauthorized complaint attempt')
      .field('description', 'Should be rejected without valid token header.')
      .field('category', 'Roads')
      .field('location', 'Unknown location');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('TC-07: Officer updates status SUBMITTED -> UNDER_REVIEW -> 200, StatusHistory created', async () => {
    // Citizen files grievance
    const fileRes = await request(app)
      .post('/api/v1/grievances')
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('title', 'Streetlight flickering issue')
      .field('description', 'Lights flickering continuously at night.')
      .field('category', 'Streetlights')
      .field('location', 'Sector 10');

    const grievanceId = fileRes.body.data.grievance._id;

    // Officer updates status
    const updateRes = await request(app)
      .patch(`/api/v1/grievances/${grievanceId}/status`)
      .set('Authorization', `Bearer ${officerRoadsToken}`)
      .send({
        status: STATUSES.UNDER_REVIEW,
        remark: 'Initial officer review underway'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.grievance.status).toBe(STATUSES.UNDER_REVIEW);
    expect(updateRes.body.data.statusHistory.toStatus).toBe(STATUSES.UNDER_REVIEW);
    expect(updateRes.body.data.statusHistory.remark).toBe('Initial officer review underway');
  });

  test('TC-08: Officer attempts SUBMITTED -> RESOLVED (invalid jump) -> 400, "Invalid status transition"', async () => {
    const fileRes = await request(app)
      .post('/api/v1/grievances')
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('title', 'Water leakage issue')
      .field('description', 'Freshwater pipe ruptured on Sector 4 road.')
      .field('category', 'Water Supply')
      .field('location', 'Sector 4');

    const grievanceId = fileRes.body.data.grievance._id;

    // Invalid direct transition to RESOLVED
    const updateRes = await request(app)
      .patch(`/api/v1/grievances/${grievanceId}/status`)
      .set('Authorization', `Bearer ${officerWaterToken}`)
      .send({
        status: STATUSES.RESOLVED,
        remark: 'Attempting invalid direct resolution'
      });

    expect(updateRes.status).toBe(400);
    expect(updateRes.body.error.code).toBe('INVALID_TRANSITION');
    expect(updateRes.body.error.message).toContain('Invalid status transition');
  });

  test('TC-09 & TC-10: Citizen reopen workflow and strict once-only enforcement', async () => {
    // Create resolved grievance
    const grv = await Grievance.create({
      trackingId: 'GRV-2026-000099',
      title: 'Resolved streetlight complaint',
      description: 'Streetlight was reported dark.',
      category: 'Streetlights',
      priority: PRIORITIES.MEDIUM,
      location: 'Block C',
      status: STATUSES.RESOLVED,
      citizen: citizenUser._id,
      department: roadsDept._id,
      reopenCount: 0
    });

    // TC-09: First reopen -> 200, status=REOPENED, reopenCount=1
    const reopen1 = await request(app)
      .post(`/api/v1/grievances/${grv._id}/reopen`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ reason: 'Light fixture started flickering again today' });

    expect(reopen1.status).toBe(200);
    expect(reopen1.body.data.grievance.status).toBe(STATUSES.REOPENED);
    expect(reopen1.body.data.grievance.reopenCount).toBe(1);

    // TC-10: Second reopen -> 403, "Grievance can only be reopened once"
    const reopen2 = await request(app)
      .post(`/api/v1/grievances/${grv._id}/reopen`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ reason: 'Attempting second reopen' });

    expect(reopen2.status).toBe(403);
    expect(reopen2.body.error.code).toBe('FORBIDDEN');
    expect(reopen2.body.error.message).toBe('Grievance can only be reopened once');
  });

  test('TC-11: Upload image larger than 1 MB -> 400, "File size exceeds 1 MB limit"', async () => {
    const oversizedImage = Buffer.alloc(1.2 * 1024 * 1024, 0); // 1.2 MB

    const res = await request(app)
      .post('/api/v1/grievances')
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('title', 'Oversized image test')
      .field('description', 'Uploading buffer that exceeds 1 MB limit.')
      .field('category', 'Roads')
      .field('location', 'Road 5')
      .attach('attachments', oversizedImage, { filename: 'huge.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('File size exceeds 1 MB limit');
  });

  test('TC-12: Upload a .gif file -> 400, "Only JPG and PNG files are allowed"', async () => {
    const gifBuffer = Buffer.from('GIF89a...');

    const res = await request(app)
      .post('/api/v1/grievances')
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('title', 'GIF upload attempt')
      .field('description', 'Uploading non-jpeg non-png file.')
      .field('category', 'Roads')
      .field('location', 'Road 6')
      .attach('attachments', gifBuffer, { filename: 'animation.gif', contentType: 'image/gif' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Only JPG and PNG files are allowed');
  });

  test('TC-13: Upload 3 images at once -> 400, "Maximum 2 attachments allowed"', async () => {
    const img1 = Buffer.from('image1');
    const img2 = Buffer.from('image2');
    const img3 = Buffer.from('image3');

    const res = await request(app)
      .post('/api/v1/grievances')
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('title', 'Three images test')
      .field('description', 'Uploading 3 files to trigger Multer max count error.')
      .field('category', 'Roads')
      .field('location', 'Road 7')
      .attach('attachments', img1, { filename: 'img1.png', contentType: 'image/png' })
      .attach('attachments', img2, { filename: 'img2.png', contentType: 'image/png' })
      .attach('attachments', img3, { filename: 'img3.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Maximum 2 attachments allowed');
  });

  test('TC-14: Citizen tries to access admin analytics -> 403, "Not authorized"', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/summary')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('TC-15: Citizen tries to view another citizen\'s grievance -> 404', async () => {
    // Grievance created by Citizen 1
    const grv = await Grievance.create({
      trackingId: 'GRV-2026-000077',
      title: 'Private grievance Citizen 1',
      description: 'Private complaint.',
      category: 'Roads',
      location: 'Block A',
      citizen: citizenUser._id,
      department: roadsDept._id
    });

    // Citizen 2 requests it
    const res = await request(app)
      .get(`/api/v1/grievances/${grv._id}`)
      .set('Authorization', `Bearer ${citizen2Token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('TC-16: Citizen requests grievance detail — response must NOT contain attachments.data', async () => {
    const grv = await Grievance.create({
      trackingId: 'GRV-2026-000088',
      title: 'Attachment data stripping test',
      description: 'Testing data field stripping in detail view.',
      category: 'Roads',
      location: 'Block D',
      citizen: citizenUser._id,
      department: roadsDept._id,
      attachments: [
        {
          filename: 'evidence.png',
          mimeType: 'image/png',
          size: 1024,
          data: Buffer.from('secret-binary-data')
        }
      ]
    });

    const res = await request(app)
      .get(`/api/v1/grievances/${grv._id}`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.grievance.attachments).toHaveLength(1);
    expect(res.body.data.grievance.attachments[0].filename).toBe('evidence.png');
    expect(res.body.data.grievance.attachments[0].data).toBeUndefined();
  });

  test('TC-17: GET /grievances/:id/attachments/0 with valid JWT -> 200, correct Content-Type, binary streamed', async () => {
    const imagePayload = Buffer.from('dummy-binary-image-data-payload');

    const grv = await Grievance.create({
      trackingId: 'GRV-2026-000089',
      title: 'Attachment streaming test',
      description: 'Verifying attachment streaming endpoint.',
      category: 'Roads',
      location: 'Block E',
      citizen: citizenUser._id,
      department: roadsDept._id,
      attachments: [
        {
          filename: 'photo.jpg',
          mimeType: 'image/jpeg',
          size: imagePayload.length,
          data: imagePayload
        }
      ]
    });

    const res = await request(app)
      .get(`/api/v1/grievances/${grv._id}/attachments/0`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/jpeg');
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.toString()).toBe(imagePayload.toString());
  });

  test('TC-18: Auto-escalation flags unresolved grievance older than 7 days and notifies admin', async () => {
    const nineDaysAgo = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);

    // Create overdue grievance directly via collection to preserve backdated createdAt
    const grvDoc = {
      trackingId: 'GRV-2026-000095',
      title: 'Unattended dangerous street hole',
      description: 'Complaint left unattended for over 9 days.',
      category: 'Roads',
      priority: PRIORITIES.HIGH,
      location: 'Highway Exit 3',
      status: STATUSES.SUBMITTED,
      citizen: citizenUser._id,
      department: roadsDept._id,
      escalated: false,
      reopenCount: 0,
      createdAt: nineDaysAgo,
      updatedAt: nineDaysAgo
    };

    await Grievance.collection.insertOne(grvDoc);

    // Execute escalation runner
    const result = await runEscalation();
    expect(result.escalatedCount).toBe(1);

    // Verify DB update
    const updated = await Grievance.findOne({ trackingId: 'GRV-2026-000095' });
    expect(updated.escalated).toBe(true);

    // Verify admin received notification
    const Notification = require('../models/Notification');
    const adminNotif = await Notification.findOne({
      user: adminUser._id,
      grievance: updated._id
    });
    expect(adminNotif).not.toBeNull();
    expect(adminNotif.message).toContain('escalated');
  });
});
