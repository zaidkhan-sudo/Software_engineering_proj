const http = require('http');
const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:5001/api/v1';
const SOCKET_URL = 'http://localhost:5001';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const headers = {};
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
  console.log('=== Phase 6 Socket.IO and Notification Verification ===\n');

  // Step 1: Authenticate users
  console.log('1. Authenticating test users...');
  const adminLogin = await request('POST', '/auth/login', {
    email: 'admin@grievance.local',
    password: 'admin123'
  });
  const adminToken = adminLogin.body.data.token;

  const waterLogin = await request('POST', '/auth/login', {
    email: 'officer.water@grievance.local',
    password: 'officer123'
  });
  const waterToken = waterLogin.body.data.token;

  const citizen1Login = await request('POST', '/auth/login', {
    email: 'citizen1@grievance.local',
    password: 'citizen123'
  });
  const citizen1Token = citizen1Login.body.data.token;
  const citizen1Id = citizen1Login.body.data.user._id;

  const citizen2Login = await request('POST', '/auth/login', {
    email: 'citizen2@grievance.local',
    password: 'citizen123'
  });
  const citizen2Token = citizen2Login.body.data.token;

  console.log(`✓ Tokens acquired. Citizen 1 ID: ${citizen1Id}\n`);

  // Step 2: Test Socket connection without token (must be rejected)
  console.log('2. Testing Socket.IO connection without token...');
  await new Promise((resolve, reject) => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: {},
      reconnection: false
    });

    socket.on('connect_error', (err) => {
      console.log(`✓ Connection rejected as expected: "${err.message}"`);
      socket.close();
      if (err.message.includes('Authentication required')) {
        resolve();
      } else {
        reject(new Error(`Unexpected error message: ${err.message}`));
      }
    });

    socket.on('connect', () => {
      socket.close();
      reject(new Error('Connection unexpectedly succeeded without token!'));
    });
  });
  console.log('');

  // Step 3: Test Socket connection with deactivated user
  console.log('3. Testing Socket.IO connection with deactivated user...');
  // Create a temporary user and deactivate
  const tempEmail = `temp.deactivated.${Date.now()}@grievance.local`;
  const regRes = await request('POST', '/auth/register', {
    name: 'Temp Deactivated User',
    email: tempEmail,
    password: 'password123',
    phone: '9876543210'
  });
  const tempToken = regRes.body.data.token;
  const tempUserId = regRes.body.data.user._id;

  // Admin deactivates this user
  const deactRes = await request('PATCH', `/users/${tempUserId}`, { isActive: false }, adminToken);
  console.log(`Deactivation response: ${deactRes.status}, isActive: ${deactRes.body.data?.user?.isActive}`);

  await new Promise((resolve, reject) => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token: tempToken },
      reconnection: false
    });

    socket.on('connect_error', (err) => {
      console.log(`✓ Connection rejected for deactivated user: "${err.message}"`);
      socket.close();
      if (err.message.includes('Account is inactive or does not exist')) {
        resolve();
      } else {
        reject(new Error(`Unexpected error message: ${err.message}`));
      }
    });

    socket.on('connect', () => {
      socket.close();
      reject(new Error('Connection unexpectedly succeeded for deactivated user!'));
    });
  });
  console.log('');

  // Step 4: TC-19 Real-time status update delivery via Socket.IO
  console.log('4. Testing TC-19: Real-time status update delivery...');
  // Connect citizen1 socket
  const citizenSocket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token: citizen1Token },
    reconnection: false
  });

  await new Promise((resolve, reject) => {
    citizenSocket.on('connect', () => {
      console.log('✓ Citizen 1 Socket.IO connected successfully.');
      resolve();
    });
    citizenSocket.on('connect_error', (err) => {
      reject(new Error(`Citizen socket connect error: ${err.message}`));
    });
  });

  // Find GRV-2026-000003 (owned by citizen1, category Water Supply, currently UNDER_REVIEW)
  const grievancesRes = await request('GET', '/grievances?search=GRV-2026-000003', null, waterToken);
  const grv3 = grievancesRes.body.data.grievances[0];
  console.log(`Target grievance: ${grv3.trackingId} (status: ${grv3.status})`);

  // Set up socket event listener for TC-19
  const statusUpdatePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for status-update socket event'));
    }, 5000);

    citizenSocket.on('status-update', (data) => {
      clearTimeout(timeout);
      console.log('>>> Received Socket.IO event [status-update]:', JSON.stringify(data));
      resolve(data);
    });
  });

  // Also listen for general notification event
  let receivedGeneralNotification = null;
  citizenSocket.on('notification', (data) => {
    console.log('>>> Received Socket.IO event [notification]:', JSON.stringify(data));
    receivedGeneralNotification = data;
  });

  // Officer updates status from UNDER_REVIEW -> IN_PROGRESS
  console.log('Officer updating status to IN_PROGRESS...');
  const updateRes = await request(
    'PATCH',
    `/grievances/${grv3._id}/status`,
    {
      status: 'IN_PROGRESS',
      remark: 'Water pipeline maintenance crew dispatched to Sector 14'
    },
    waterToken
  );

  console.log(`Status update HTTP response: ${updateRes.status}`);

  const eventPayload = await statusUpdatePromise;
  citizenSocket.close();

  if (
    eventPayload.trackingId === grv3.trackingId &&
    eventPayload.newStatus === 'IN_PROGRESS' &&
    eventPayload.message.includes('Water pipeline maintenance crew')
  ) {
    console.log('✓ TC-19 PASSED: Real-time Socket.IO status-update received successfully by citizen!\n');
  } else {
    throw new Error('TC-19 failed: event payload did not match expected values');
  }

  // Step 5: Test Persistent Notification REST Endpoints
  console.log('5. Testing Notifications REST API...');

  // GET /notifications (citizen1)
  const notifRes = await request('GET', '/notifications', null, citizen1Token);
  console.log(`GET /notifications status: ${notifRes.status}`);
  console.log(`Unread count: ${notifRes.body.data.unreadCount}`);
  console.log(`Total notifications: ${notifRes.body.pagination.totalDocs}`);

  const firstNotif = notifRes.body.data.notifications[0];
  console.log(`Latest notification: "${firstNotif.message}" (isRead: ${firstNotif.isRead})`);

  if (notifRes.status === 200 && notifRes.body.data.unreadCount >= 1 && firstNotif.isRead === false) {
    console.log('✓ GET /notifications PASSED: Persistent notification verified in MongoDB\n');
  } else {
    throw new Error('GET /notifications failed');
  }

  // Test PATCH /notifications/:id/read with cross-user isolation
  console.log('Testing cross-user isolation on PATCH /notifications/:id/read...');
  const crossUserReadRes = await request(
    'PATCH',
    `/notifications/${firstNotif._id}/read`,
    null,
    citizen2Token
  );
  console.log(`Citizen 2 attempting to mark Citizen 1 notification as read: status ${crossUserReadRes.status}`);
  if (crossUserReadRes.status === 404) {
    console.log('✓ Isolation PASSED: 404 returned when accessing another user\'s notification\n');
  } else {
    throw new Error('Notification cross-user isolation failed');
  }

  // Citizen 1 marks their notification as read
  console.log('Testing PATCH /notifications/:id/read for owner...');
  const markReadRes = await request(
    'PATCH',
    `/notifications/${firstNotif._id}/read`,
    null,
    citizen1Token
  );
  console.log(`Mark as read status: ${markReadRes.status}, isRead: ${markReadRes.body.data.notification.isRead}`);
  if (markReadRes.status === 200 && markReadRes.body.data.notification.isRead === true) {
    console.log('✓ PATCH /notifications/:id/read PASSED\n');
  } else {
    throw new Error('PATCH /notifications/:id/read failed');
  }

  // Test PATCH /notifications/read-all
  console.log('Testing PATCH /notifications/read-all...');
  const readAllRes = await request('PATCH', '/notifications/read-all', null, citizen1Token);
  console.log(`Read all status: ${readAllRes.status}, modifiedCount: ${readAllRes.body.data.modifiedCount}`);

  const afterReadAll = await request('GET', '/notifications', null, citizen1Token);
  console.log(`Unread count after read-all: ${afterReadAll.body.data.unreadCount}`);
  if (readAllRes.status === 200 && afterReadAll.body.data.unreadCount === 0) {
    console.log('✓ PATCH /notifications/read-all PASSED\n');
  } else {
    throw new Error('PATCH /notifications/read-all failed');
  }

  console.log('========================================');
  console.log('ALL PHASE 6 VERIFICATION CHECKS PASSED!');
  console.log('========================================');
}

run().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
