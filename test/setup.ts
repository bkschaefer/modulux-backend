// Set test environment variables before any modules are loaded
process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
process.env.JWT_SECRET = 'test-secret-key-for-testing'
process.env.JWT_EXP = '3600'
process.env.ADMIN_USER_EMAIL = 'admin@test.com'
process.env.ADMIN_USER_PASSWORD = 'testpassword123'
process.env.ADMIN_USER_NAME = 'TestAdmin'
process.env.BREVO_API_USER = 'test-user'
process.env.BREVO_API_PASS = 'test-pass'
process.env.AWS_BUCKET_NAME = 'test-bucket'
process.env.AWS_BUCKET_REGION = 'us-east-1'
process.env.AWS_ACCESS_KEY_ID = 'test-access-key'
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key'

// Mock buffer-equal-constant-time to fix jsonwebtoken import issues in Jest
// This is a known compatibility issue
jest.mock('buffer-equal-constant-time', () => {
  return function bufferEqualConstantTime(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) {
      return false
    }
    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i]
    }
    return result === 0
  }
})
