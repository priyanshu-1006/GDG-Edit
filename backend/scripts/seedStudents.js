import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Student from '../models/Student.js';
import connectDB from '../config/database.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedStudents = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB via configuration');

    const csvPath = process.argv[2] || 'k:\\GDG\\GDG-Edit\\students_2026-03-19.csv';
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split('\n');

    const headers = lines[0].trim().split(',');
    
    // Expected headers: Roll No,Name,Email,Department,Batch,Section,Phone,Hostel
    
    const students = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',');
      if (values.length >= 6) {
        students.push({
          rollNo: values[0].trim(),
          name: values[1].trim(),
          email: values[2].trim(),
          department: values[3].trim(),
          section: values[5].trim()
        });
      }
    }

    console.log(`Parsed ${students.length} students. Clearing old data and inserting...`);
    
    await Student.deleteMany({});
    await Student.insertMany(students);
    
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding students:', error);
    process.exit(1);
  }
};

seedStudents();
