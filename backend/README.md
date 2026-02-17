# 🚀 GDG MMMUT Backend Setup Guide

## 📋 Prerequisites

Before you begin, make sure you have:
- **Node.js** (v18 or higher) installed
- **MongoDB** (local or Atlas account)
- **Git** installed

---

## 🛠️ Installation Steps

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Set Up Environment Variables

1. Copy the example env file:
```bash
copy .env.example .env
```

2. Edit `.env` file and add your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database - Choose one option:

# Option A: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/gdg-mmmut

# Option B: MongoDB Atlas (Recommended)
# Go to https://cloud.mongodb.com/
# Create free cluster
# Get connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gdg-mmmut

# JWT Secret (Change this!)
JWT_SECRET=your-super-secret-jwt-key-CHANGE-THIS-TO-RANDOM-STRING
JWT_EXPIRE=7d

# Google OAuth
# Get from: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# GitHub OAuth
# Get from: https://github.com/settings/developers
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Session Secret (Change this!)
SESSION_SECRET=your-session-secret-key-CHANGE-THIS

# Immerse Mail System (Optional - for Immerse event management)
IMMERSE_RESEND_API_KEY=your-resend-api-key
IMMERSE_JWT_SECRET=your-immerse-jwt-secret-CHANGE-THIS
```

---

## 🔐 OAuth Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project "GDG MMMUT"
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add **Authorized redirect URIs**:
   ```
   http://localhost:5000/api/auth/google/callback
   http://localhost:3000/api/auth/google/callback
   ```
7. Save **Client ID** and **Client Secret**

### GitHub OAuth Setup

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name**: GDG MMMUT
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
4. Save **Client ID** and **Client Secret**

---

## 🗄️ Database Setup

### Option A: Local MongoDB

1. **Install MongoDB Community Server**:
   - Download from: https://www.mongodb.com/try/download/community
   - Install and start MongoDB service

2. **Verify installation**:
```bash
mongosh
```

### Option B: MongoDB Atlas (Recommended)

1. Go to https://cloud.mongodb.com/
2. Sign up for free account
3. Create new cluster (Free tier M0)
4. Choose cloud provider and region
5. Wait for cluster to be created (2-3 minutes)
6. Click **Connect** → **Connect your application**
7. Copy connection string
8. Replace `<password>` with your password
9. Paste in `.env` as `MONGODB_URI`

---

## 🏃 Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

You should see:
```
✅ MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
📊 Database: gdg-mmmut
🚀 Server running on port 5000
📍 Environment: development
🌐 Frontend URL: http://localhost:5173
```

---

## 🧪 Testing the API

### Health Check

```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "OK",
  "message": "GDG MMMUT API is running",
  "timestamp": "2025-10-16T..."
}
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/github` | GitHub OAuth login |
| GET | `/api/auth/profile` | Get user profile (Protected) |
| PUT | `/api/auth/profile` | Update profile (Protected) |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events |
| GET | `/api/events/:id` | Get single event |
| POST | `/api/events` | Create event (Admin) |
| PUT | `/api/events/:id` | Update event (Admin) |
| DELETE | `/api/events/:id` | Delete event (Admin) |

### Registrations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/registrations` | Register for event |
| GET | `/api/registrations/my-events` | Get user's events |
| GET | `/api/registrations/event/:id` | Get event registrations (Admin) |

### Study Jams

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/study-jams/progress` | Get progress |
| POST | `/api/study-jams/complete` | Mark lab complete |
| GET | `/api/study-jams/leaderboard` | Get leaderboard |

### Teams (Hackblitz)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/teams` | Create team |
| GET | `/api/teams/event/:id` | Get event teams |
| POST | `/api/teams/:id/join` | Join team |
| POST | `/api/teams/:id/submit` | Submit project |

---

## 🧪 Testing with Postman/Thunder Client

### 1. Register User

**POST** `http://localhost:5000/api/auth/register`

Body:
```json
{
  "name": "Test Student",
  "email": "student@test.com",
  "password": "password123"
}
```

### 2. Login

**POST** `http://localhost:5000/api/auth/login`

Body:
```json
{
  "email": "student@test.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "Test Student",
    "email": "student@test.com",
    ...
  }
}
```

### 3. Get Profile (Protected Route)

**GET** `http://localhost:5000/api/auth/profile`

Headers:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 🔍 Troubleshooting

### MongoDB Connection Error

```
❌ Error connecting to MongoDB: ...
```

**Solutions:**
1. Check if MongoDB is running
2. Verify `MONGODB_URI` in `.env`
3. Check network/firewall settings
4. For Atlas: Add your IP to whitelist

### OAuth Not Working

**Solutions:**
1. Verify Client ID and Secret in `.env`
2. Check redirect URIs match exactly
3. Make sure OAuth app is active
4. Clear browser cookies

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**
1. Change PORT in `.env`
2. Or kill process using port 5000:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill
```

---

## 📚 Next Steps

1. ✅ Backend is running
2. ✅ Test APIs with Postman
3. ⏭️ **Next**: Update frontend to connect to this backend
4. ⏭️ Create seed data for testing

---

## 🎯 Quick Test Script

Create `test-api.rest` file (for REST Client VS Code extension):

```http
### Health Check
GET http://localhost:5000/health

### Register User
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Test Student",
  "email": "test@example.com",
  "password": "password123"
}

### Login
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}

### Get Profile (Add token from login response)
GET http://localhost:5000/api/auth/profile
Authorization: Bearer YOUR_TOKEN_HERE

### Get Events
GET http://localhost:5000/api/events
```

---

**🎉 Backend is ready! Now let's connect the frontend!**
