import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// CORS configuration
export const corsMiddleware = cors({
  origin: process.env.CORS_ORIGINS?.split(',') || process.env.ADMIN_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Helmet configuration
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for React dev
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
});

// Rate limiting for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for Twilio webhooks
export const twilioRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiting
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

