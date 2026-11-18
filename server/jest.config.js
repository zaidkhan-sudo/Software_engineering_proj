module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 20000,
  setupFilesAfterEnv: ['./tests/setup.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    'jobs/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ]
};
