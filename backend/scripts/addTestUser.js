import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import connectDB from '../config/database.js';
import Student from '../models/Student.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const addTestUser = async () => {
  try {
    await connectDB();
    await Student.findOneAndUpdate(
      { email: '2024021205@mmmut.ac.in' },
      {
        rollNo: '2024021205',
        name: 'AMITESH VISHWAKARMA',
        email: '2024021205@mmmut.ac.in',
        department: 'Computer Science and Engineering',
        section: 'C'
      },
      { upsert: true, new: true }
    );
    console.log('Test user added successfully!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

addTestUser();
