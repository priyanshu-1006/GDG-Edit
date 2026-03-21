import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = "mongodb+srv://gdgtechmmmutadmin:Amitesh968@gdg-mmmut.xqbicrx.mongodb.net/?appName=GDG-MMMUT";
// The URI must connect to `test` database because the current DB says `ac-7il3sbj-shard-00-00.xqbicrx.mongodb.net test`.
// Wait, the url is just the root, mongoose connects to `test` by default.

mongoose.connect(uri).then(async () => {
    try {
        await mongoose.connection.collection('inductions').dropIndex('email_1');
        console.log("Successfully dropped duplicate email index from inductions collection.");
    } catch (err) {
        console.error("Error dropping index (it might not exist):", err.message);
    }
    process.exit(0);
});
