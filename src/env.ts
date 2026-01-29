import dotenv from 'dotenv'
import { getEnvVar } from './helper/getEnvVar'

dotenv.config()

const MONGODB_URI = getEnvVar('MONGODB_URI', {
  type: 'string',
  required: true,
  validate: (value) => {
    if (!/^mongodb(\+srv)?:\/\//.test(value)) {
      throw new Error('MONGODB_URI must be a valid MongoDB URI.')
    }
  },
})

const NODE_ENV = getEnvVar('NODE_ENV', {
  type: 'string',
  defaultValue: 'development',
  validate: (value) => {
    const allowed = ['development', 'production', 'test']
    if (!allowed.includes(value)) {
      throw new Error(
        `NODE_ENV must be one of the following values: ${allowed.join(', ')}.`,
      )
    }
  },
})

const PORT = getEnvVar('PORT', {
  type: 'number',
  defaultValue: 3000,
  validate: (value) => {
    if (value < 1024 || value > 65535) {
      throw new Error('PORT must be between 1024 and 65535.')
    }
  },
})

const JWT_SECRET = getEnvVar('JWT_SECRET', {
  type: 'string',
  defaultValue: NODE_ENV === 'development' ? 'secret' : undefined,
})

const JWT_EXP = getEnvVar('JWT_EXP', {
  type: 'number',
  defaultValue: 60,
})

const ADMIN_USER_EMAIL = getEnvVar('ADMIN_USER_EMAIL', {
  type: 'string',
  required: true,
})

const ADMIN_USER_PASSWORD = getEnvVar('ADMIN_USER_PASSWORD', {
  type: 'string',
  required: true,
})

const ADMIN_USER_NAME = getEnvVar('ADMIN_USER_NAME', {
  type: 'string',
  defaultValue: 'John Doe',
})

const DB_PREFILL = getEnvVar('DB_PREFILL', {
  type: 'boolean',
  required: false,
  defaultValue: false,
})

const BREVO_API_USER = getEnvVar('BREVO_API_USER', {
  type: 'string',
  required: true,
})

const BREVO_API_PASS = getEnvVar('BREVO_API_PASS', {
  type: 'string',
  required: true,
})

const VITE_SERVER_URL = getEnvVar('VITE_SERVER_URL', {
  type: 'string',
  defaultValue: 'http://localhost:5173',
})

const AWS_BUCKET_NAME = getEnvVar('AWS_BUCKET_NAME', {
  type: 'string',
  required: true,
})

const AWS_BUCKET_REGION = getEnvVar('AWS_BUCKET_REGION', {
  type: 'string',
  required: true,
})

const AWS_ACCESS_KEY_ID = getEnvVar('AWS_ACCESS_KEY_ID', {
  type: 'string',
  required: true,
})

const AWS_SECRET_ACCESS_KEY = getEnvVar('AWS_SECRET_ACCESS_KEY', {
  type: 'string',
  required: true,
})

export const env = {
  ADMIN_USER_PASSWORD,
  ADMIN_USER_EMAIL,
  ADMIN_USER_NAME,
  VITE_SERVER_URL,
  JWT_EXP,
  MONGODB_URI,
  JWT_SECRET,
  NODE_ENV,
  PORT,
  DB_PREFILL,
  BREVO_API_USER,
  BREVO_API_PASS,
  AWS_BUCKET_NAME,
  AWS_BUCKET_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
}
