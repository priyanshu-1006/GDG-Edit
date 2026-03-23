# IMMERSE Super-Admin OTP Implementation Guide

## Overview
This document explains the OTP-based login system implemented for IMMERSE Admin Portal. The super-admin user `priyanshudlw1@gmail.com` requires OTP verification for every login.

---

## 🌱 Seed Super-Admin

### Step 1: Run the Seed Script
```bash
cd backend
npm run seed-super-admin
```

### Expected Output
```
🌱 Seeding Immerse Super Admin...

✅ Super Admin created successfully!

📝 Credentials:
   Email: priyanshudlw1@gmail.com
   Password: priyanshu
   Role: immerse_super_admin
   Active: true

🔐 Login Details:
   1. Go to: /immerse/login
   2. Enter email and password
   3. Enter OTP sent to your email
   4. You will be logged in

⚠️  Important Notes:
   - OTP is required for every login
   - OTP expires in 2 minutes
   - Check spam folder if email not received
```

---

## 🔐 Login Flow

### Step 1: Enter Credentials
1. Navigate to `/immerse/login`
2. Enter email: `priyanshudlw1@gmail.com`
3. Enter password: `priyanshu`
4. Click "Continue"

### Step 2: Verify OTP
1. You'll receive an OTP via email
2. Enter the 6-digit OTP on the login page
3. OTP expires in 120 seconds (2 minutes)
4. Click "Verify OTP" to complete login
5. If OTP expires, click "Resend OTP" to request a new one

### Step 3: Access Dashboard
After successful OTP verification, you'll be redirected to the IMMERSE Dashboard.

---

## 📡 Backend API Endpoints

### 1. Initiate Login (Email + Password)
**Endpoint:** `POST /api/immerse/auth/initiate-login`

**Request Body:**
```json
{
  "email": "priyanshudlw1@gmail.com",
  "password": "priyanshu"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "sessionId": "base64_encoded_session_id"
}
```

**Error Responses:**
- `400`: Missing email or password
- `401`: Invalid credentials / Account deactivated
- `500`: Server error

---

### 2. Verify OTP (Required for Login)
**Endpoint:** `POST /api/immerse/auth/verify-otp`

**Request Body:**
```json
{
  "email": "priyanshudlw1@gmail.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Super Admin",
    "email": "priyanshudlw1@gmail.com",
    "role": "immerse_super_admin"
  }
}
```

**Error Responses:**
- `400`: Missing email or OTP
- `401`: Invalid or expired OTP / Admin not found
- `500`: Server error

---

## 🗄️ Database Models

### OTP Model (`models/OTP.js`)
```javascript
{
  email: String,        // Admin email
  otp: String,         // 6-digit OTP code
  createdAt: Date      // Auto-expires in 120 seconds (TTL index)
}
```

### ImmerseAdmin Model (`models/ImmerseAdmin.js`)
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed with bcrypt),
  role: 'immerse_admin' | 'immerse_super_admin',
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 💻 Frontend Components

### ImmerseLogin.jsx (`frontend/src/pages/Immerse/ImmerseLogin.jsx`)

#### State Management:
- `step`: 'credentials' or 'otp' - Login flow step
- `formData`: { email, password }
- `otp`: 6-digit OTP input
- `otpTimer`: Countdown timer (120s)
- `canResendOtp`: Allow resend after timer expires

#### Key Functions:
- `handleInitiateLogin()` - POST to /auth/initiate-login
- `handleVerifyOtp()` - POST to /auth/verify-otp
- `handleResendOtp()` - Resend OTP email
- `handleBackToCredentials()` - Go back to step 1

#### Features:
- ✅ Real-time countdown timer
- ✅ Resend OTP button (enabled after timeout)
- ✅ Input validation (6-digit OTP only)
- ✅ Error messages with styling
- ✅ Loading states
- ✅ Smooth animations

---

## 📧 Email Service

### OTP Email Template
- **Subject:** "Your IMMERSE Login OTP - Valid for 2 Minutes"
- **From:** team@gdg.mmmut.app (IMMERSE 2026 - MMMUT)
- **Content:**
  - Displays 6-digit OTP in large, bold text
  - Expiry warning (2 minutes)
  - Security notice
  - Professional HTML styling

### Sending Method
The OTP email is sent via:
1. **Primary:** Resend API (configured in .env)
2. **Fallback:** Nodemailer (if Resend fails)
3. **Console Fallback:** Logs OTP to server if no email service available

### Environment Variables
```env
RESEND_API_KEY=re_FX9mgwFA_E3bk9sCP3cmgX81YbBzaNgXe
IMMERSE_RESEND_API_KEY=re_XL7ug13L_MYvpE4rk1YWP4o7RUxKx71Je
```

---

## 🔒 Security Features

### 1. OTP Expiration
- OTP auto-deletes from database after 120 seconds (2 minutes)
- MongoDB TTL index on `createdAt` field

### 2. Password Hashing
- Passwords hashed with bcrypt (10 salt rounds)
- Plaintext passwords are never stored

### 3. JWT Tokens
- Token issued after successful OTP verification
- Immerse-specific JWT secret: `IMMERSE_JWT_SECRET`
- Token expiry: 7 days

### 4. Email Validation
- OTP tied to specific email address
- Email must match during verification

### 5. Rate Limiting (Optional Enhancement)
- Can implement rate limiting on `/auth/initiate-login` to prevent brute force
- Can implement rate limiting on `/auth/verify-otp` to prevent OTP guessing

---

## 🛠️ Troubleshooting

### Issue: OTP Not Received
**Solution:**
1. Check spam/junk folder
2. Click "Resend OTP" on login page
3. Check if RESEND_API_KEY is configured in .env
4. Check server logs for email sending errors

### Issue: OTP Expired
**Solution:**
1. OTP is valid for 2 minutes only
2. Click "Resend OTP" to request a new one
3. Complete login within the new OTP's timeout period

### Issue: "Invalid Credentials"
**Solution:**
1. Verify email: `priyanshudlw1@gmail.com`
2. Verify password: `priyanshu`
3. Check if admin account is active (isActive: true)
4. Check if admin exists in database

### Issue: OTP Verification Fails
**Solution:**
1. Ensure OTP has NOT expired (check timer)
2. Verify you're entering the exact OTP from email
3. Check if email matches the one used in step 1
4. OTP is 6 digits and numeric only

### Issue: Server Error During Login
**Solution:**
1. Check MongoDB connection
2. Verify `.env` file is configured correctly
3. Check `MONGODB_URI` environment variable
4. Restart backend server: `npm run dev`

---

## 📋 Implementation Checklist

### Backend Setup
- [x] OTP Model created (`models/OTP.js`)
- [x] ImmerseAdmin Model updated (supports super_admin role)
- [x] Seed script created (`scripts/seedSuperAdmin.js`)
- [x] OTP endpoints added to routes:
  - [x] POST /auth/initiate-login
  - [x] POST /auth/verify-otp
- [x] OTP email template created
- [x] immerseEmailService configured
- [x] npm script added: `npm run seed-super-admin`

### Frontend Setup
- [x] Two-step login UI implemented
- [x] Credentials step (Step 1)
- [x] OTP verification step (Step 2)
- [x] OTP countdown timer (120s)
- [x] Resend OTP functionality
- [x] Error handling and validation
- [x] Back button to credentials
- [x] Loading states
- [x] API integration with immerseApi

### Database
- [x] OTP collection with TTL index
- [x] Super-admin user record

---

## 🚀 Quick Start Commands

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies (if not done)
npm install

# 3. Setup environment variables
# Edit .env with existing configuration

# 4. Seed super-admin
npm run seed-super-admin

# 5. Start backend server
npm run dev

# 6. In another terminal, start frontend
cd frontend
npm run dev

# 7. Open browser and navigate to
# http://localhost:5173/immerse/login

# 8. Login with:
# Email: priyanshudlw1@gmail.com
# Password: priyanshu
# OTP: Check your email
```

---

## 📝 Additional Notes

### Creating Additional Admins
After seeding the super-admin, you can create more admins via the API:

**Endpoint:** `POST /api/immerse/auth/create-admin` (Super Admin Only)

**Request:**
```bash
curl -X POST http://localhost:5000/api/immerse/auth/create-admin \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Name",
    "email": "admin@example.com",
    "password": "secure_password",
    "role": "immerse_admin"
  }'
```

### Changing Password
**Endpoint:** `PUT /api/immerse/auth/change-password` (Authenticated Users)

**Request:**
```bash
curl -X PUT http://localhost:5000/api/immerse/auth/change-password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "priyanshu",
    "newPassword": "new_secure_password"
  }'
```

### Updating Profile
**Endpoint:** `PUT /api/immerse/auth/profile` (Authenticated Users)

---

## 📞 Support

For issues or questions regarding the OTP implementation:
1. Check this documentation
2. Review server logs: `npm run dev`
3. Check browser console for frontend errors
4. Verify `.env` configuration
5. Ensure MongoDB connection is active

---

**Last Updated:** March 23, 2026
**Status:** ✅ Implementation Complete - Ready for Testing
