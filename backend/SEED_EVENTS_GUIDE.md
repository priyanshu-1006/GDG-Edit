# 🌱 Event Database Seeding Guide

## Overview
This script seeds your MongoDB database with all the GDG MMMUT events, making them immediately available on your website.

---

## 🚀 Quick Start

### Option 1: Add New Events (Safe - Recommended)
This keeps existing events and only adds new one:

```powershell
cd backend
npm run seed-events
```

### Option 2: Clear & Re-seed (Destructive)
⚠️ **WARNING**: This delete ALL existing events first!

```powershell
cd backend
npm run seed-events-clear
```

### Option 3: Update Existing + Add New
Updates events with same name, adds new ones:

```powershell
cd backend
npm run seed-events-update
```

---

## 📋 What Gets Seeded?

The script will add **15 events** to your database:

1. ✅ **Induction 2025** – Your GDG Journey Begins (June 15)
2. ✅ **Google Cloud Skills Boost Arcade Program** (July 1)
3. ✅ **Developers' Summer of Code (DSoC - Cohort #1)** (July 2)
4. ✅ **The Call of the Community** (August 1)
5. ✅ **Orientation Session** (August 15)
6. ✅ **DevXplore** (August 20)
7. ✅ **Week of Geek** (August 23)
8. ✅ **Startup Bootcamp – University Edition** (August 30)
9. ✅ **Flutter Fusion** (September 20)
10. ✅ **NullTrace: Ops #0 - The Ghost Protocol** (September 28)
11. ✅ **Google Cloud Gen AI Study Jams October** (October 1)
12. ✅ **Immerse** (October 10)
13. ✅ **Build With AI** (November 10)
14. ✅ **Developers' Winter of Code (DWoC - Cohort #2)** (December 1)
15. ✅ **HackBlitz** (December 15)

---

## 🔑 Prerequisites

### 1. MongoDB Connection
Ensure your `.env` file has correct MongoDB connection:

```env
MONGODB_URI=mongodb://localhost:27017/gdg_mmmut
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/gdg_mmmut
```

### 2. Admin User Required
The script needs at least one user in the database to assign as event creator.

**If you don't have a user yet:**

```powershell
# Option A: Create admin via script
npm run create-admin

# Option B: Sign up through the app
# Then manually update role in MongoDB:
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

---

## 📊 Expected Output

When you run the seed script, you'll see:

```
🌱 GDG MMMUT Event Database Seeder
==================================

🔄 Connecting to MongoDB...
✅ MongoDB Connected Successfully!

🔍 Looking for admin user...
✅ Found user: Admin Name (admin@example.com)
   Role: admin

🔍 Checking existing events...
   Found 0 existing events

➕ Inserting events into database...
✅ Successfully inserted 15 events!

📊 Database Summary:
   Total Events: 15
   Published Events: 15
   Upcoming Events: 12

📋 Events in Database:
   1. 🟢 ✅ Induction 2025 – Your GDG Journey Begins
      📅 2025-06-15 | Meetup
   2. 🟢 ✅ Google Cloud Skills Boost Arcade Program
      📅 2025-07-01 | Workshop
   ... (and so on)

🎉 Database seeding completed successfully!
✨ Your events are now ready to be displayed on the website!

👋 MongoDB connection closed
```

**Legend**:
- 🟢 = Upcoming event
- 🔴 = Past event
- ✅ = Published
- ❌ = Not published

---

## 🔍 Verify Seeding

### Check in MongoDB Compass
1. Open MongoDB Compass
2. Connect to your database
3. Navigate to `gdg_mmmut` → `events` collection
4. You should see 15 documents

### Check in Your App
1. Start your backend: `npm run dev`
2. Start your frontend: `cd ../frontend && npm run dev`
3. Visit: `http://localhost:5173/events`
4. All 15 events should be visible!

### Check via API
```powershell
# Get all events
curl http://localhost:5000/api/events

# Or in browser
# Visit: http://localhost:5000/api/events
```

---

## 🎯 Event Data Structure

Each event has:

```javascript
{
  name: "Event Name",
  type: "Workshop | Study Jam | Hackathon | Meetup | Conference | Webinar | Tech Fest",
  description: "Event description...",
  date: Date object,
  time: "10:00 AM - 5:00 PM",
  location: "MMMUT Campus or Online",
  image: "https://...",
  capacity: 100,
  registeredCount: 0,
  published: true,
  draft: false,
  registrationOpen: true,
  tags: ["Tag1", "Tag2"],
  eventCategory: "general | study-jam | immerse | hackblitz",
  createdBy: adminUserId
}
```

---

## 🛠️ Troubleshooting

### Error: "No users found in database"
**Solution**: Create an admin user first
```powershell
npm run create-admin
```

### Error: "MongoServerError: E11000 duplicate key error"
**Reason**: Events already exist with same name

**Solution**: 
```powershell
# Option 1: Use clear mode to remove all first
npm run seed-events-clear

# Option 2: Use update mode to update existing
npm run seed-events-update

# Option 3: Manually delete events in MongoDB
db.events.deleteMany({})
```

### Error: "Connection refused" or "ECONNREFUSED"
**Reason**: MongoDB is not running

**Solution**:
```powershell
# Start MongoDB service
# Windows:
net start MongoDB

# Or start MongoDB manually:
mongod --dbpath C:\data\db
```

### Error: "Invalid connection string"
**Solution**: Check your `MONGODB_URI` in `.env` file

---

## 📝 Customizing Events

To add your own events or modify existing ones:

1. **Edit the seed script**: `backend/seedEvents.js`
2. **Modify the `eventsData` array**:

```javascript
const eventsData = [
  {
    name: 'Your Custom Event',
    type: 'Workshop', // Must be one of the enum values
    description: 'Event description here...',
    date: new Date('2025-12-31'),
    time: '2:00 PM - 5:00 PM',
    location: 'Your Location',
    image: 'https://your-image-url.com/image.jpg',
    capacity: 100,
    published: true,
    registrationOpen: true,
    tags: ['Custom', 'Event'],
    eventCategory: 'general'
  },
  // ... more events
];
```

3. **Run the seed script again**:
```powershell
npm run seed-events
```

---

## 🎨 Event Types Available

- **Workshop** - Hands-on learning sessions
- **Study Jam** - Google Cloud study programs
- **Hackathon** - Coding competitions
- **Meetup** - Community gatherings
- **Conference** - Large-scale tech events
- **Webinar** - Online seminars
- **Tech Fest** - Multi-day technology festivals

---

## 📂 Event Categories

- **general** - Regular events
- **study-jam** - Google Cloud Study Jams
- **immerse** - AR/VR focused events
- **hackblitz** - Major hackathon events

---

## 🔄 Re-seeding

If you need to update events later:

```powershell
# Method 1: Update existing events + add new ones
npm run seed-events-update

# Method 2: Clear everything and start fresh
npm run seed-events-clear

# Method 3: Just add new events (skip duplicates)
npm run seed-events
```

---

## 📊 Database Queries

### View all events in MongoDB shell:
```javascript
db.events.find().pretty()
```

### Count events:
```javascript
db.events.countDocuments()
```

### Find published events only:
```javascript
db.events.find({ published: true })
```

### Find upcoming events:
```javascript
db.events.find({ 
  published: true, 
  date: { $gte: new Date() } 
}).sort({ date: 1 })
```

### Delete all events:
```javascript
db.events.deleteMany({})
```

---

## 🚀 Production Deployment

When deploying to production:

1. **Connect to production database**:
   - Update `MONGODB_URI` in production `.env`
   - Usually MongoDB Atlas for production

2. **Run seed script on production**:
   ```powershell
   # SSH into your server or use Vercel CLI
   npm run seed-events
   ```

3. **Verify on production**:
   - Visit: `https://gdg-backend-ten.vercel.app/api/events`
   - Should return all seeded events

---

## 📚 Related Files

- **Seed Script**: `backend/seedEvents.js`
- **Event Model**: `backend/models/Event.js`
- **Event Routes**: `backend/routes/event.routes.js`
- **Event Service**: `frontend/src/utils/eventService.js`

---

## ✅ Success Checklist

After seeding, verify:

- [ ] Script completed without errors
- [ ] MongoDB shows 15 events in `events` collection
- [ ] Each event has `createdBy` field populated
- [ ] All events have `published: true`
- [ ] Events visible at `http://localhost:5173/events`
- [ ] API endpoint returns events: `http://localhost:5000/api/events`
- [ ] Can register for events (if logged in)
- [ ] Events appear in admin portal: `/admin/events`

---

## 🎉 You're Done!

Your database is now populated with events. Users can:
- ✅ Browse events on the public page
- ✅ Register for events
- ✅ View their registrations
- ✅ Admins can manage everything

**Next Steps**:
1. Test registration flow
2. Customize event details if needed
3. Add more events through admin panel
4. Deploy to production!

---

## 💡 Pro Tips

1. **Backup First**: Before clearing events, export them:
   ```powershell
   mongoexport --db gdg_mmmut --collection events --out events_backup.json
   ```

2. **Import Backup**:
   ```powershell
   mongoimport --db gdg_mmmut --collection events --file events_backup.json
   ```

3. **Test on Development First**: Always test seeding on local database before production

4. **Regular Updates**: Keep your event data updated by re-running the seed script periodically

---

**Need Help?** Check the main documentation:
- `EVENT_REGISTRATION_FLOW.md` - Complete system flow
- `IMPLEMENTATION_SUMMARY.md` - What was implemented
- `QUICK_START_GUIDE.md` - Testing guide
