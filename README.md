# AI Voice Restaurant Reservations System

## 📋 Project Overview

This is a complete end-to-end restaurant reservation system that allows customers to make reservations via phone calls. An AI agent answers calls, understands natural language in French or English, transcribes speech using Whisper, extracts reservation information, checks table availability with a reliable algorithm that prevents double-booking, and saves confirmed reservations. Administrators can view and manage reservations in real-time through a web dashboard.

### Key Features

- **Voice-based reservations**: Customers call the restaurant phone number and interact with an AI agent
- **Bilingual support**: Agent understands and responds in both French and English
- **Real-time updates**: Admin dashboard updates instantly when new reservations are created via Socket.io
- **Reliable availability**: Prevents double-booking using MongoDB unique indexes and TTL locks
- **HTTPS backend**: Secure API with self-signed certificates for development
- **Microservices architecture**: Separate AI service for STT, NLU, and dialog management

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Customer Phone Call                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Twilio Voice API                         │
│  (Handles phone calls, recordings, webhooks)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express)                        │
│  - HTTPS Server (port 3443)                                  │
│  - Twilio Webhooks (/twilio/voice/*)                        │
│  - Admin API (/api/admin/*)                                 │
│  - Socket.io (real-time events)                            │
│  - Passport + JWT Auth                                      │
└──────────┬──────────────────────────────┬────────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐      ┌──────────────────────────────┐
│  AI Microservice     │      │      MongoDB                 │
│  (port 4000)         │      │  - Users                     │
│  - Whisper STT       │      │  - Restaurants               │
│  - NLU Extraction    │      │  - Tables                    │
│  - Dialog Management │      │  - Reservations              │
└──────────────────────┘      │  - CallSessions              │
                              │  - TableSlotLocks            │
                              └──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│              Admin Dashboard (React + Vite)                  │
│  - Login (JWT auth)                                          │
│  - Live Reservations Feed (Socket.io)                        │
│  - Tables Management                                         │
│  - Restaurant Settings                                       │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Backend**: Node.js, Express, TypeScript, MongoDB, Mongoose
- **Authentication**: Passport.js with passport-local-mongoose, JWT
- **Security**: CORS, Helmet, express-rate-limit
- **Real-time**: Socket.io
- **Voice**: Twilio Voice API
- **AI**: OpenAI Whisper API (STT), GPT-4o-mini (NLU/Dialog)
- **Frontend**: React, TypeScript, Vite, Socket.io-client
- **Infrastructure**: Docker, Docker Compose, GitLab CI/CD

## 📁 Project Structure

```
Projet-MIGI-2026-Team-X/
├── README.md
├── .env.example
├── .gitlab-ci.yml
├── docker-compose.yml
├── certs/                    # HTTPS certificates (self-signed for dev)
│   └── .gitkeep
├── scripts/                  # Utility scripts
│   └── generate-certs.sh    # Generate self-signed certificates
├── backend/                  # Express API server
│   ├── src/
│   │   ├── config/          # Database, passport, socket.io
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API routes (auth, admin, twilio)
│   │   ├── services/        # Business logic (availability)
│   │   ├── middleware/      # Auth, security
│   │   ├── scripts/         # Seed script
│   │   └── server.ts        # Main server file
│   ├── Dockerfile
│   └── package.json
├── admin/                    # React admin dashboard
│   ├── src/
│   │   ├── api/             # API client functions
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Zustand state management
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
└── microservices/
    └── ai/                   # AI microservice
        ├── src/
        │   ├── services/     # Whisper, NLU, Dialog
        │   └── server.ts
        ├── Dockerfile
        └── package.json
```

## 🔀 GitFlow Workflow

This project uses GitFlow for team collaboration. Here's how to work with it:

### Branch Structure

- **`main`**: Production-ready code (protected)
- **`develop`**: Integration branch for features (protected)
- **`feature/*`**: New features (e.g., `feature/add-payment`)
- **`hotfix/*`**: Urgent production fixes (e.g., `hotfix/fix-auth-bug`)
- **`release/*`**: Preparing releases (e.g., `release/v1.0.0`)

### Workflow Steps

1. **Start a new feature**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```

2. **Work on your feature**:
   - Make commits with clear messages
   - Push to remote: `git push origin feature/my-feature`

3. **Create Merge Request**:
   - Go to GitLab and create a MR from `feature/my-feature` to `develop`
   - Request review from team members
   - After approval, merge to `develop`

4. **Release**:
   ```bash
   git checkout develop
   git checkout -b release/v1.0.0
   # Update version numbers, changelog, etc.
   git checkout main
   git merge release/v1.0.0
   git tag v1.0.0
   git checkout develop
   git merge release/v1.0.0
   ```

5. **Hotfix** (urgent production fix):
   ```bash
   git checkout main
   git checkout -b hotfix/critical-bug
   # Fix the bug
   git checkout main
   git merge hotfix/critical-bug
   git tag v1.0.1
   git checkout develop
   git merge hotfix/critical-bug
   ```

### Best Practices

- Always start from `develop` for new features
- Keep feature branches small and focused
- Write clear commit messages
- Test before creating MR
- Never push directly to `main` or `develop` (use MRs)

## 🚀 Local Setup

### Prerequisites

- Node.js 20+
- MongoDB (or use Docker)
- OpenSSL (for certificate generation)
- Git

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd Projet-MIGI-2026-Team-X
```

### Step 2: Generate HTTPS Certificates

```bash
./scripts/generate-certs.sh
```

This creates self-signed certificates in `certs/`:
- `certs/cert.pem`
- `certs/privkey.pem`

**Note**: For production, use proper SSL certificates from a CA.

### Step 3: Configure Environment Variables

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and set the following:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/restaurant-reservations

# HTTPS
HTTPS_CERT_PATH=./certs/cert.pem
HTTPS_KEY_PATH=./certs/privkey.pem
HTTPS_PORT=3443

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=2h

# CORS
ADMIN_ORIGIN=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Twilio (get from https://console.twilio.com)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WEBHOOK_BASE_URL=https://your-domain.com

# OpenAI (get from https://platform.openai.com)
OPENAI_API_KEY=your-openai-api-key

# AI Microservice
AI_SERVICE_URL=http://localhost:4000
```

### Step 4: Install Dependencies

```bash
# Backend
cd backend
npm install
cd ..

# AI Microservice
cd microservices/ai
npm install
cd ../..

# Admin
cd admin
npm install
cd ..
```

### Step 5: Start MongoDB

**Option A: Using Docker**:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
```

**Option B: Local MongoDB**:
```bash
# Install MongoDB locally and start the service
mongod
```

### Step 6: Seed Database

```bash
cd backend
npm run seed
```

This creates:
- Admin user: `username: admin`, `password: admin123`
- Default restaurant
- Sample tables

### Step 7: Start Services

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
# Server runs on https://localhost:3443
```

**Terminal 2 - AI Microservice**:
```bash
cd microservices/ai
npm run dev
# Service runs on http://localhost:4000
```

**Terminal 3 - Admin Dashboard**:
```bash
cd admin
npm run dev
# Dashboard runs on http://localhost:5173
```

### Step 8: Access Admin Dashboard

1. Open browser: `http://localhost:5173`
2. Login with: `admin` / `admin123`
3. You should see the reservations dashboard

## 🌐 Déploiement en Ligne (Production)

Pour déployer votre application en ligne et qu'elle fonctionne 24/7 **sans votre PC**, consultez le guide complet :

- **[Guide de Déploiement (FR)](DEPLOYMENT-FR.md)** - Guide détaillé en français
- **[Deployment Guide (EN)](DEPLOYMENT.md)** - Detailed English guide

**Options recommandées** :
- **Railway** (Gratuit pour commencer) - Le plus simple
- **Render** (Gratuit avec limitations)
- **Heroku** (Payant mais fiable)

**Important** : ngrok nécessite que votre PC soit allumé. Pour un site accessible 24/7, vous devez déployer sur un serveur cloud.

## 🐳 Docker Setup (Alternative)

### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

Services will be available at:
- Backend: `https://localhost:3443`
- AI Service: `http://localhost:4000`
- Admin: `http://localhost:3000`
- MongoDB: `localhost:27017`

**Note**: Make sure to generate certificates before starting:
```bash
./scripts/generate-certs.sh
```

## 📞 Twilio Configuration

### 1. Get Twilio Credentials

1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token from the console
3. Purchase a phone number (or use trial number)

### 2. Configure Webhooks

In Twilio Console → Phone Numbers → Manage → Active Numbers:

1. Select your phone number
2. Under "Voice & Fax", set:
   - **A CALL COMES IN**: `https://your-domain.com/twilio/voice/incoming`
   - **STATUS CALLBACK URL**: `https://your-domain.com/twilio/voice/status` (optional)

### 3. Webhook Endpoints

The backend provides these endpoints:

- **POST `/twilio/voice/incoming`**: Initial call webhook
  - Receives: `From`, `To`, `CallSid`
  - Returns: TwiML XML with greeting and `<Record>`

- **POST `/twilio/voice/recording`**: After recording completes
  - Receives: `CallSid`, `RecordingUrl`
  - Returns: TwiML with pause and redirect to `/poll`
  - Triggers async processing (Whisper + NLU)

- **POST `/twilio/voice/poll`**: Polling endpoint
  - Receives: `CallSid`
  - Returns: Next prompt or continues conversation
  - If `pendingJob=true`, waits and redirects again

### 4. Testing with ngrok (Local Development)

For local testing, use ngrok to expose your HTTPS backend:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3443

# Use the HTTPS URL in TWILIO_WEBHOOK_BASE_URL
# Example: https://abc123.ngrok.io
```

Update `.env`:
```env
TWILIO_WEBHOOK_BASE_URL=https://abc123.ngrok.io
```

## 🔑 External API Keys

### OpenAI API Key

1. Sign up at https://platform.openai.com
2. Go to API Keys section
3. Create a new secret key
4. Add to `.env`: `OPENAI_API_KEY=sk-...`

**Used for**:
- Whisper API: Speech-to-text transcription
- GPT-4o-mini: NLU extraction and dialog management

### Twilio Credentials

1. Sign up at https://www.twilio.com
2. Get Account SID and Auth Token from console
3. Purchase a phone number
4. Add to `.env`:
   ```env
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1234567890
   ```

## 🧪 Testing

### Manual E2E Test Checklist

1. **Start Stack Locally**:
   ```bash
   # Terminal 1: MongoDB
   docker run -d -p 27017:27017 mongo:7
   
   # Terminal 2: Backend
   cd backend && npm run dev
   
   # Terminal 3: AI Service
   cd microservices/ai && npm run dev
   
   # Terminal 4: Admin
   cd admin && npm run dev
   ```

2. **Login to Admin Dashboard**:
   - Open `http://localhost:5173`
   - Login: `admin` / `admin123`
   - Verify dashboard loads

3. **Place Reservation via Phone Call**:
   - Call your Twilio number
   - Say: "Bonjour, je voudrais réserver une table pour 4 personnes demain à 19h"
   - AI should respond in French
   - Confirm reservation
   - **Check**: Reservation appears instantly in admin dashboard (Socket.io)

4. **Test Concurrent Booking**:
   - Try to book the same time/table from two calls simultaneously
   - **Expected**: System prevents double-booking, proposes alternatives

5. **Test Confirmation Flow**:
   - Make a reservation request
   - When asked for confirmation, say "non" (NO)
   - **Expected**: Reservation is cancelled, not saved as CONFIRMED

### API Testing with cURL

#### Register Admin User

```bash
curl -X POST https://localhost:3443/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin2","password":"admin123"}' \
  -k
```

#### Login and Get JWT

```bash
curl -X POST https://localhost:3443/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -k

# Response: {"token":"eyJhbGc...","user":{"id":"...","username":"admin","role":"ADMIN"}}
```

#### Get Reservations (with JWT)

```bash
TOKEN="your-jwt-token-here"

curl -X GET https://localhost:3443/api/admin/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -k
```

#### Create Table

```bash
curl -X POST https://localhost:3443/api/admin/tables \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Table 9","capacity":4,"zone":"Window","isJoinable":true}' \
  -k
```

#### Create Reservation (Admin)

```bash
curl -X POST https://localhost:3443/api/admin/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startAt":"2025-11-15T19:00:00Z",
    "partySize":4,
    "customerName":"John Doe",
    "customerPhone":"+1234567890",
    "notes":"Anniversary"
  }' \
  -k
```

#### Update Reservation Status

```bash
curl -X PATCH https://localhost:3443/api/admin/reservations/RESERVATION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"CONFIRMED"}' \
  -k
```

### Socket.io Testing

Connect to Socket.io with JWT:

```javascript
// In browser console or Node.js script
const io = require('socket.io-client');
const socket = io('https://localhost:3443', {
  auth: { token: 'your-jwt-token' },
  transports: ['websocket'],
  rejectUnauthorized: false
});

socket.on('connect', () => console.log('Connected'));
socket.on('reservation:created', (data) => console.log('New reservation:', data));
socket.on('reservation:updated', (data) => console.log('Updated:', data));
socket.on('reservation:cancelled', (data) => console.log('Cancelled:', data));
```

## 📝 API Documentation

### Authentication Endpoints

- **POST `/auth/register`**: Register new admin user
  - Body: `{ username, password }`
  - Response: `{ message, userId }`

- **POST `/auth/login`**: Login and get JWT
  - Body: `{ username, password }`
  - Response: `{ token, user }`

- **GET `/auth/me`**: Get current user (requires JWT)
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ user }`

### Admin API Endpoints (All require JWT)

#### Reservations

- **GET `/api/admin/reservations`**: List reservations
  - Query params: `date`, `status`, `startDate`, `endDate`
  - Response: `Reservation[]`

- **GET `/api/admin/reservations/:id`**: Get single reservation
  - Response: `Reservation`

- **POST `/api/admin/reservations`**: Create reservation
  - Body: `{ startAt, partySize, customerName, customerPhone, notes? }`
  - Response: `Reservation`

- **PATCH `/api/admin/reservations/:id`**: Update reservation status
  - Body: `{ status }`
  - Response: `Reservation`

#### Tables

- **GET `/api/admin/tables`**: List all tables
- **POST `/api/admin/tables`**: Create table
  - Body: `{ name, capacity, zone?, isJoinable? }`
- **PUT `/api/admin/tables/:id`**: Update table
- **DELETE `/api/admin/tables/:id`**: Delete table

#### Restaurant

- **GET `/api/admin/restaurant`**: Get restaurant settings
- **PUT `/api/admin/restaurant`**: Update restaurant settings
  - Body: `{ name?, phoneNumber?, slotMinutes?, avgDurationMin?, bufferMin?, timezone? }`

### Twilio Webhooks (No auth required)

- **POST `/twilio/voice/incoming`**: Initial call
- **POST `/twilio/voice/recording`**: Recording complete
- **POST `/twilio/voice/poll`**: Poll for processing status

## 🔒 Security Features

- **HTTPS**: All backend communication over HTTPS
- **JWT Authentication**: Token-based auth for admin API
- **CORS**: Configured for specific origins
- **Helmet**: Security headers
- **Rate Limiting**: 
  - Auth endpoints: 5 requests per 15 minutes
  - Twilio endpoints: 100 requests per 15 minutes
  - Admin API: 100 requests per 15 minutes
- **Password Hashing**: Using passport-local-mongoose (no bcrypt)

## 🐛 Troubleshooting

### Certificate Errors

If you see certificate errors:
```bash
# Regenerate certificates
./scripts/generate-certs.sh

# Make sure paths in .env are correct
HTTPS_CERT_PATH=./certs/cert.pem
HTTPS_KEY_PATH=./certs/privkey.pem
```

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
docker ps | grep mongo

# Or check local MongoDB
mongosh --eval "db.adminCommand('ping')"
```

### Socket.io Connection Fails

- Check JWT token is valid
- Verify CORS settings in backend
- Check browser console for errors
- Ensure backend is running on HTTPS

### Twilio Webhooks Not Working

- Verify `TWILIO_WEBHOOK_BASE_URL` is accessible
- Use ngrok for local testing
- Check Twilio console for webhook errors
- Verify webhook URLs in Twilio phone number settings

### AI Service Errors

- Check `OPENAI_API_KEY` is set correctly
- Verify API key has credits/quota
- Check AI service logs: `cd microservices/ai && npm run dev`

## 📚 Additional Resources

- [Twilio Voice API Docs](https://www.twilio.com/docs/voice)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Socket.io Documentation](https://socket.io/docs)

## 👥 Team Collaboration

### GitLab Repository Setup

1. After creating the repository on GitLab, add `@isghir` as a **Maintainer**:
   - Go to Project Settings → Members
   - Add `@isghir` with role "Maintainer"

2. Protect branches:
   - Settings → Repository → Protected Branches
   - Protect `main` and `develop` (require MR, no direct pushes)

### Code Review Process

1. Create feature branch from `develop`
2. Push changes and create Merge Request
3. Request review from team members
4. Address feedback
5. Merge after approval

## 📅 Project Timeline

- **Deadline**: Lundi 3 nov 2025
- **Presentation**: 10 min + 5 min Q&A

## 📄 License

This project is part of the MIAGE M1G1 course assignment.

---

**Note**: This is a demonstration project. For production use, ensure:
- Proper SSL certificates (not self-signed)
- Strong JWT secrets
- Secure API key storage
- Database backups
- Monitoring and logging
- Error handling and retries

