const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5001/api/v1';

function request(method, path, body = null, token = null, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const headers = { ...customHeaders };
    let data = null;

    if (body) {
      data = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(data);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      url,
      {
        method,
        headers
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch (e) {
            parsed = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log('=== Phase 7 Analytics, Audit Logs & Escalation Verification ===\n');

  // 1. Authenticate users
  console.log('1. Authenticating test users...');
  const adminLogin = await request('POST', '/auth/login', {
    email: 'admin@grievance.local',
    password: 'admin123'
  });
  const adminToken = adminLogin.body.data.token;

  const citizenLogin = await request('POST', '/auth/login', {
    email: 'citizen1@grievance.local',
    password: 'citizen123'
  });
  const citizenToken = citizenLogin.body.data.token;

  const officerLogin = await request('POST', '/auth/login', {
    email: 'officer.roads@grievance.local',
    password: 'officer123'
  });
  const officerToken = officerLogin.body.data.token;

  console.log('✓ Tokens acquired (admin, citizen, officer).\n');

  // 2. Test RBAC (non-admins must receive 403 on analytics and audit logs)
  console.log('2. Testing RBAC access control (non-admin 403)...');
  const [cSummary, cCategory, cResTime, cAudit, oSummary] = await Promise.all([
    request('GET', '/analytics/summary', null, citizenToken),
    request('GET', '/analytics/by-category', null, citizenToken),
    request('GET', '/analytics/resolution-time', null, citizenToken),
    request('GET', '/audit-logs', null, citizenToken),
    request('GET', '/analytics/summary', null, officerToken)
  ]);

  console.log(`Citizen /analytics/summary status: ${cSummary.status}`);
  console.log(`Citizen /analytics/by-category status: ${cCategory.status}`);
  console.log(`Citizen /analytics/resolution-time status: ${cResTime.status}`);
  console.log(`Citizen /audit-logs status: ${cAudit.status}`);
  console.log(`Officer /analytics/summary status: ${oSummary.status}`);

  if (
    cSummary.status === 403 &&
    cCategory.status === 403 &&
    cResTime.status === 403 &&
    cAudit.status === 403 &&
    oSummary.status === 403
  ) {
    console.log('✓ RBAC PASSED: Non-admin users are strictly blocked with 403 Forbidden\n');
  } else {
    throw new Error('RBAC check failed');
  }

  // 3. Test Analytics endpoints with Admin Token
  console.log('3. Testing Admin Analytics endpoints...');

  // GET /analytics/summary
  const summaryRes = await request('GET', '/analytics/summary', null, adminToken);
  console.log(`GET /analytics/summary status: ${summaryRes.status}`);
  console.log('Summary payload:', JSON.stringify(summaryRes.body.data));

  const summary = summaryRes.body.data;
  if (
    summaryRes.status === 200 &&
    summary.total === 9 &&
    summary.byStatus.RESOLVED === 2 &&
    summary.byStatus.SUBMITTED === 2 &&
    summary.byStatus.IN_PROGRESS === 2 &&
    summary.byStatus.UNDER_REVIEW === 1 &&
    summary.byStatus.REJECTED === 1 &&
    summary.byStatus.REOPENED === 1
  ) {
    console.log('✓ GET /analytics/summary PASSED: Correct totals and status distribution matching seed\n');
  } else {
    throw new Error('GET /analytics/summary numbers did not match expected seed');
  }

  // GET /analytics/by-category
  const categoryRes = await request('GET', '/analytics/by-category', null, adminToken);
  console.log(`GET /analytics/by-category status: ${categoryRes.status}`);
  console.log('Categories count:', categoryRes.body.data?.categories?.length);
  console.log('Top categories:', JSON.stringify(categoryRes.body.data?.categories?.slice(0, 3)));

  if (categoryRes.status === 200 && Array.isArray(categoryRes.body.data?.categories) && categoryRes.body.data.categories.length > 0) {
    console.log('✓ GET /analytics/by-category PASSED\n');
  } else {
    throw new Error('GET /analytics/by-category failed');
  }

  // GET /analytics/resolution-time
  const resTimeRes = await request('GET', '/analytics/resolution-time', null, adminToken);
  console.log(`GET /analytics/resolution-time status: ${resTimeRes.status}`);
  console.log('Resolution time by dept:', JSON.stringify(resTimeRes.body.data?.departments));

  if (resTimeRes.status === 200 && Array.isArray(resTimeRes.body.data?.departments)) {
    console.log('✓ GET /analytics/resolution-time PASSED\n');
  } else {
    throw new Error('GET /analytics/resolution-time failed');
  }

  // 4. Test Audit Logs endpoint
  console.log('4. Testing Admin Audit Logs endpoint...');
  const auditRes = await request('GET', '/audit-logs?limit=5', null, adminToken);
  console.log(`GET /audit-logs status: ${auditRes.status}`);
  console.log(`Total audit entries: ${auditRes.body.pagination?.totalDocs}`);
  console.log(`Returned entries: ${auditRes.body.data?.auditLogs?.length}`);

  const sampleLog = auditRes.body.data?.auditLogs?.[0];
  console.log('Sample audit entry:', JSON.stringify({
    from: sampleLog?.fromStatus,
    to: sampleLog?.toStatus,
    changedBy: sampleLog?.changedBy?.name,
    grievance: sampleLog?.grievance?.trackingId,
    remark: sampleLog?.remark
  }));

  if (
    auditRes.status === 200 &&
    auditRes.body.pagination?.totalDocs >= 26 &&
    sampleLog?.changedBy?.name &&
    sampleLog?.grievance?.trackingId
  ) {
    console.log('✓ GET /audit-logs PASSED: Paginated history with populated references\n');
  } else {
    throw new Error('GET /audit-logs failed');
  }

  // 5. Test POST /jobs/escalate authorization strategies
  console.log('5. Testing POST /jobs/escalate Authorization...');

  // 5a. No auth
  const noAuthRes = await request('POST', '/jobs/escalate', {});
  console.log(`No auth status: ${noAuthRes.status} (expected 401)`);

  // 5b. Invalid secret
  const badSecretRes = await request('POST', '/jobs/escalate', {}, null, {
    'x-cron-secret': 'wrong_secret_123'
  });
  console.log(`Bad cron-secret status: ${badSecretRes.status} (expected 401)`);

  // 5c. Citizen Bearer token
  const citizenJobRes = await request('POST', '/jobs/escalate', {}, citizenToken);
  console.log(`Citizen Bearer token status: ${citizenJobRes.status} (expected 401)`);

  // 5d. Valid admin Bearer token
  const adminJobRes = await request('POST', '/jobs/escalate', {}, adminToken);
  console.log(`Admin Bearer token status: ${adminJobRes.status}, data: ${JSON.stringify(adminJobRes.body.data)}`);

  // 5e. Valid x-cron-secret header
  const cronSecretRes = await request('POST', '/jobs/escalate', {}, null, {
    'x-cron-secret': 'dev_cron_secret_12345'
  });
  console.log(`Valid x-cron-secret status: ${cronSecretRes.status}, data: ${JSON.stringify(cronSecretRes.body.data)}`);

  if (
    noAuthRes.status === 401 &&
    badSecretRes.status === 401 &&
    citizenJobRes.status === 401 &&
    adminJobRes.status === 200 &&
    cronSecretRes.status === 200
  ) {
    console.log('✓ POST /jobs/escalate Auth PASSED: Protected against invalid access, accepts Admin Bearer and x-cron-secret\n');
  } else {
    throw new Error('POST /jobs/escalate authorization failed');
  }

  // 6. Test TC-18: Auto-escalation functionality for overdue grievances
  console.log('6. Testing TC-18: Auto-escalation functionality...');
  // Connect to DB directly via mongoose to backdate a grievance
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grievance-system');
  const Grievance = require('../models/Grievance');

  // Backdate grievance GRV-2026-000004 (SUBMITTED, Drainage) to 9 days ago directly via collection
  const nineDaysAgo = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);
  const upRes = await Grievance.collection.updateOne(
    { trackingId: 'GRV-2026-000004' },
    { $set: { createdAt: nineDaysAgo, escalated: false } }
  );
  console.log(`Update result: matched=${upRes.matchedCount}, modified=${upRes.modifiedCount}`);
  const checkGrv = await Grievance.findOne({ trackingId: 'GRV-2026-000004' });
  console.log(`Grievance createdAt is now: ${checkGrv.createdAt.toISOString()}`);

  // Trigger escalation job
  const escalateTriggerRes = await request('POST', '/jobs/escalate', {}, null, {
    'x-cron-secret': 'dev_cron_secret_12345'
  });
  console.log(`Escalation trigger response: ${escalateTriggerRes.status}, count: ${escalateTriggerRes.body.data?.escalatedCount}`);

  // Verify grievance in DB is now escalated: true
  const updatedGrv4 = await Grievance.findOne({ trackingId: 'GRV-2026-000004' });
  console.log(`GRV-2026-000004 escalated status: ${updatedGrv4.escalated}`);

  // Verify Admin received notification
  const adminNotifs = await request('GET', '/notifications', null, adminToken);
  const escalationNotif = adminNotifs.body.data?.notifications?.find(n =>
    n.message && n.message.includes('GRV-2026-000004 escalated')
  );
  console.log(`Admin escalation notification: "${escalationNotif?.message}"`);

  await mongoose.disconnect();

  if (
    escalateTriggerRes.body.data?.escalatedCount >= 1 &&
    updatedGrv4.escalated === true &&
    escalationNotif
  ) {
    console.log('✓ TC-18 PASSED: Overdue grievance flagged with escalated: true and admin notified\n');
  } else {
    throw new Error('TC-18 failed');
  }

  console.log('========================================');
  console.log('ALL PHASE 7 VERIFICATION CHECKS PASSED!');
  console.log('========================================');
}

run().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
