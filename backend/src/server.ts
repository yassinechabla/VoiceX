import express, { Express } from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import passport from 'passport';
import { connectDatabase } from './config/database';
import './config/passport';
import { corsMiddleware, helmetMiddleware, twilioRateLimiter, apiRateLimiter } from './middleware/security';
import { setupSocketIO } from './config/socket';
import { setSocketIO } from './utils/socketEvents';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import twilioRoutes from './routes/twilio';

dotenv.config();

const app: Express = express();
// Use PORT from environment (cloud platforms set this) or fallback to HTTPS_PORT or 3443
const PORT = parseInt(process.env.PORT || process.env.HTTPS_PORT || '3443', 10);

// Security middlewares
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Routes
app.use('/auth', authRoutes);
app.use('/api/admin', apiRateLimiter, adminRoutes);
app.use('/twilio', twilioRateLimiter, twilioRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Determine if we should use HTTPS or HTTP
// In production (cloud), the platform usually handles HTTPS via reverse proxy
const USE_HTTPS = process.env.USE_HTTPS !== 'false' && process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';

let server: any;
let io: any;

// Load HTTPS certificates (only if using HTTPS)
if (USE_HTTPS) {
  const certPath = process.env.HTTPS_CERT_PATH || path.join(__dirname, '../certs/cert.pem');
  const keyPath = process.env.HTTPS_KEY_PATH || path.join(__dirname, '../certs/privkey.pem');

  let cert: Buffer;
  let key: Buffer;

  try {
    cert = fs.readFileSync(certPath);
    key = fs.readFileSync(keyPath);
  } catch (error) {
    console.error('❌ Failed to load HTTPS certificates:', error);
    console.error('Please generate certificates using: ./scripts/generate-certs.sh');
    console.error('Or set USE_HTTPS=false and NODE_ENV=production for cloud deployment');
    process.exit(1);
  }

  // Create HTTPS server
  server = https.createServer({ cert, key }, app);
  io = setupSocketIO(server);
} else {
  // Use HTTP (cloud platform will handle HTTPS via reverse proxy)
  const http = require('http');
  server = http.createServer(app);
  io = setupSocketIO(server);
}

setSocketIO(io); // Set for use in utils

// Start server
async function startServer() {
  try {
    await connectDatabase();
    
    const protocol = USE_HTTPS ? 'HTTPS' : 'HTTP';
    const url = USE_HTTPS ? `https://localhost:${PORT}` : `http://localhost:${PORT}`;
    
    server.listen(PORT, () => {
      console.log(`🚀 ${protocol} Server running on ${url}`);
      console.log(`📡 Health check: ${url}/health`);
      if (isProduction) {
        console.log('🌐 Production mode: Platform handles HTTPS via reverse proxy');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, io };

