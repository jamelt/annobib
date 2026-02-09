export const RATE_LIMITS = {
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },
  register: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
  },
  ai: {
    maxRequests: 20,
    windowMs: 60 * 1000,
  },
  export: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
  upload: {
    maxRequests: 20,
    windowMs: 60 * 1000,
  },
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
} as const
