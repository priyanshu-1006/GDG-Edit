import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('Missing required env var: MONGODB_URI');
    process.exit(1);
}

mongoose.connect(uri).then(async () => {
    try {
        await mongoose.connection.collection('inductions').dropIndex('email_1');
        console.log("Successfully dropped duplicate email index from inductions collection.");
    } catch (err) {
        console.error("Error dropping index (it might not exist):", err.message);
    }
    process.exit(0);
});
