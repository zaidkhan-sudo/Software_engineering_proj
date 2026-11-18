const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables for test suite
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const testMongoUri = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/grievance-system-test';
const devMongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grievance-system';

if (testMongoUri === devMongoUri) {
  throw new Error('Safety guard: MONGO_URI_TEST cannot be identical to production/dev MONGO_URI.');
}

// Connect to dedicated test database before running test suite
beforeAll(async () => {
  try {
    await mongoose.connect(testMongoUri, {
      runtimeAdapters: {
        os: require('os')
      }
    });
  } catch (err) {
    console.error('[setup.js] connect error:', err);
    throw err;
  }
});

// Clean up database collections after each test to ensure test isolation
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

// Drop test database and close connection after entire test run
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
