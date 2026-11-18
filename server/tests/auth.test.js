const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Authentication & User Management Tests (TC-01 to TC-04)', () => {
  const validCitizen = {
    name: 'Rahul Sharma',
    email: 'rahul.test@grievance.local',
    password: 'password123',
    phone: '9876543210'
  };

  test('TC-01: Register with valid data -> 201, user created, JWT returned', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(validCitizen);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.name).toBe(validCitizen.name);
    expect(res.body.data.user.email).toBe(validCitizen.email.toLowerCase());
    expect(res.body.data.user.role).toBe('citizen');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.token).toBeDefined();

    // Verify persisted in DB
    const dbUser = await User.findOne({ email: validCitizen.email });
    expect(dbUser).not.toBeNull();
    expect(dbUser.isActive).toBe(true);
  });

  test('TC-02: Register with duplicate email -> 409, "Email already registered"', async () => {
    // First registration
    await request(app)
      .post('/api/v1/auth/register')
      .send(validCitizen);

    // Duplicate registration attempt (different case to verify case-insensitivity)
    const duplicate = { ...validCitizen, email: 'RAHUL.TEST@grievance.local' };
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(duplicate);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE');
    expect(res.body.error.message).toContain('Email already registered');
  });

  test('TC-03: Login with wrong password -> 401, "Invalid credentials"', async () => {
    // Register user first
    await request(app)
      .post('/api/v1/auth/register')
      .send(validCitizen);

    // Login with invalid password
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: validCitizen.email,
        password: 'wrong_password_999'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.message).toBe('Invalid credentials');
  });

  test('TC-04: Login as deactivated user (isActive: false) -> 401, "Account deactivated"', async () => {
    // Register user
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send(validCitizen);

    const userId = regRes.body.data.user._id;

    // Manually deactivate user in DB
    await User.findByIdAndUpdate(userId, { isActive: false });

    // Attempt login
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: validCitizen.email,
        password: validCitizen.password
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.message).toBe('Account deactivated');
  });

  test('GET /api/v1/auth/me returns authenticated user profile without passwordHash', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send(validCitizen);

    const token = regRes.body.data.token;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validCitizen.email);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  test('PATCH /api/v1/auth/me updates profile name and phone', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send(validCitizen);

    const token = regRes.body.data.token;

    const res = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Rahul Updated',
        phone: '9123456789'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Rahul Updated');
    expect(res.body.data.user.phone).toBe('9123456789');
  });
});
