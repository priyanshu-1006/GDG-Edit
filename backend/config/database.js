import mongoose from 'mongoose';
import dns from 'dns';

// Force Google DNS for SRV resolution — fixes mobile data / restrictive DNS servers
dns.setServers(['8.8.8.8', '8.8.4.4']);
const connectDB = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4, // Force IPv4 — avoids IPv6 DNS issues
      });

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📊 Database: ${conn.connection.name}`);

      return;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${attempt}/${retries} failed: ${error.message}`);

      if (attempt < retries) {
        console.log(`⏳ Retrying in 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }

      // Final attempt failed — show helpful diagnostics
      console.error('\n🔧 TROUBLESHOOTING GUIDE:');

      if (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        console.error('   ⚠️  DNS/Network issue detected. Try these steps:');
        console.error('   1. Check your internet connection');
        console.error('   2. If on a VPN, try disconnecting it');
        console.error('   3. Try switching to a different DNS (e.g., 8.8.8.8 or 1.1.1.1)');
        console.error('   4. If on a restricted network (college/office), the firewall may block MongoDB Atlas');
        console.error('   5. Try using a mobile hotspot to verify it\'s a network issue');
        console.error('   6. Check MongoDB Atlas status: https://status.cloud.mongodb.com/\n');
      } else if (error.message.includes('IP') || error.message.includes('whitelist') || error.message.includes('authentication')) {
        console.error('   ⚠️  Authentication/IP issue detected:');
        console.error('   1. Go to https://cloud.mongodb.com/');
        console.error('   2. Select your cluster → "Network Access"');
        console.error('   3. Click "Add IP Address" → "Allow Access from Anywhere" (0.0.0.0/0)');
        console.error('   4. Verify your database username/password in MONGODB_URI\n');
      }

      process.exit(1);
    }
  }
};

export default connectDB;

