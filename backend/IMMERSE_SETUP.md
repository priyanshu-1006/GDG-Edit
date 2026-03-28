# Immerse Mail System Setup Guide

## Overview

The Immerse Mail System is a dedicated email management platform for handling sponsor outreach and student communications for the Immerse event. It uses Resend as the email service provider and has its own authentication system separate from the main GDG application.

## Environment Variables

Add the following to your `.env` file:

```env
# Immerse Mail System
IMMERSE_RESEND_API_KEY=your-resend-api-key
IMMERSE_JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

> ⚠️ **Important**: Generate a secure random string for `IMMERSE_JWT_SECRET` in production.

## Setup Steps

### 1. Install Dependencies

The Resend package should already be installed. If not:

```bash
cd backend
npm install resend
```

### 2. Create Initial Admin

Set bootstrap credentials in environment variables:

```env
IMMERSE_BOOTSTRAP_ADMIN_EMAIL=admin@example.com
IMMERSE_BOOTSTRAP_ADMIN_PASSWORD=change-this-password
IMMERSE_BOOTSTRAP_ADMIN_NAME=Immerse Admin
```

Run the admin creation script:

```bash
cd backend
node scripts/createImmerseAdmin.js
```

This creates a super admin account using the environment variable values.

### 3. Seed Default Templates

Run the template seeding script:

```bash
node scripts/seedImmerseTemplates.js
```

This creates 5 default email templates:
- Sponsor Outreach
- Sponsor Follow-up
- Registration Confirmation
- Event Reminder
- General Announcement

## Access Points

- **Login Page**: `/immerse/login`
- **Dashboard**: `/immerse` or `/immerse/dashboard`
- **Compose Email**: `/immerse/compose`
- **Contacts**: `/immerse/contacts`
- **Templates**: `/immerse/templates`
- **Email Logs**: `/immerse/logs`

## API Endpoints

All Immerse APIs are under `/api/immerse`:

### Authentication
- `POST /api/immerse/auth/login` - Admin login
- `GET /api/immerse/auth/profile` - Get current admin profile
- `PUT /api/immerse/auth/change-password` - Change password

### Contacts
- `GET /api/immerse/contacts` - List contacts (with filtering)
- `GET /api/immerse/contacts/:id` - Get contact by ID
- `POST /api/immerse/contacts` - Create contact
- `PUT /api/immerse/contacts/:id` - Update contact
- `DELETE /api/immerse/contacts/:id` - Delete contact
- `POST /api/immerse/contacts/bulk` - Bulk import contacts

### Templates
- `GET /api/immerse/templates` - List templates
- `GET /api/immerse/templates/:id` - Get template by ID
- `POST /api/immerse/templates` - Create template
- `PUT /api/immerse/templates/:id` - Update template
- `DELETE /api/immerse/templates/:id` - Delete template

### Email Sending
- `POST /api/immerse/email/send` - Send single email
- `POST /api/immerse/email/bulk` - Send bulk emails
- `GET /api/immerse/email/logs` - Get email logs
- `GET /api/immerse/email/stats` - Get email statistics

## User Roles

- **immerse_admin**: Can send emails, manage contacts and templates
- **immerse_super_admin**: Full access including admin management

## Email Templates

Templates support variable substitution using `{{variable}}` syntax:
- `{{name}}` - Contact name
- `{{email}}` - Contact email  
- `{{company}}` - Company name
- `{{customField}}` - Custom fields from contact

## Security Notes

1. JWT tokens expire in 7 days
2. Passwords are hashed with bcrypt
3. All routes require authentication except login
4. Super admin role required for admin management

## Resend Configuration

The system uses Resend with the following configuration:
- **Domain**: immerse.mmmut.app
- **From Address**: Immerse Team <noreply@immerse.mmmut.app>

Ensure your domain is verified in the Resend dashboard.

## Troubleshooting

### "Invalid credentials" error
- Verify the admin account exists: `db.immerseadmins.find({})`
- Reset password using: `node scripts/createImmerseAdmin.js` (will update if exists)

### Emails not sending
- Check Resend API key is valid
- Verify domain is verified in Resend dashboard
- Check email logs for error messages

### Token expired
- Log out and log back in
- Clear localStorage if issues persist
