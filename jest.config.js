module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/scripts/managers/baseManager.test.js'],
  testMatch: ['**/*.test.js'],
  verbose: true
};