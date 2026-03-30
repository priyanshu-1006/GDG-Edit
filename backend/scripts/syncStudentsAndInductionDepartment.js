import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

import connectDB from '../config/database.js';
import Student from '../models/Student.js';
import Induction from '../models/Induction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const DEFAULT_CSV_PATH = path.join(__dirname, '../../students_2026-03-19.csv');
const DEFAULT_TARGET_ROLL = '2025041349';
const DEFAULT_TARGET_DEPARTMENT = 'Computer Science and Engineering';

const normalize = (value = '') => value.toString().trim().replace(/\s+/g, ' ');
const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const loadStudentsFromCsv = (csvPath) => {
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const students = rows
    .map((row) => ({
      rollNo: normalize(row['Roll No']),
      name: normalize(row.Name),
      email: normalize(row.Email).toLowerCase(),
      department: normalize(row.Department),
      section: normalize(row.Section),
    }))
    .filter((student) => student.rollNo && student.name && student.email);

  // Keep the latest row if duplicate roll numbers are present in CSV.
  const byRollNo = new Map();
  for (const student of students) {
    byRollNo.set(student.rollNo, student);
  }

  return Array.from(byRollNo.values());
};

const syncStudents = async (students) => {
  if (students.length === 0) {
    throw new Error('No valid student rows found in CSV.');
  }

  const bulkOps = students.map((student) => ({
    updateOne: {
      filter: { rollNo: student.rollNo },
      update: { $set: student },
      upsert: true,
    },
  }));

  const bulkResult = await Student.bulkWrite(bulkOps, { ordered: false });
  const rollNos = students.map((student) => student.rollNo);
  const deleteResult = await Student.deleteMany({ rollNo: { $nin: rollNos } });

  return {
    upsertedCount: bulkResult.upsertedCount || 0,
    modifiedCount: bulkResult.modifiedCount || 0,
    matchedCount: bulkResult.matchedCount || 0,
    deletedCount: deleteResult.deletedCount || 0,
  };
};

const updateInductionDepartment = async (rollNo, department) => {
  const rollNoRegex = new RegExp(`^\\s*${escapeRegExp(rollNo)}\\s*$`);

  const result = await Induction.updateMany(
    { rollNumber: rollNoRegex },
    { $set: { branch: department } }
  );

  return {
    matchedCount: result.matchedCount || 0,
    modifiedCount: result.modifiedCount || 0,
  };
};

const main = async () => {
  const csvPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_CSV_PATH;
  const targetRollNo = process.argv[3] || DEFAULT_TARGET_ROLL;
  const targetDepartment = process.argv[4] || DEFAULT_TARGET_DEPARTMENT;

  try {
    await connectDB();
    console.log(`Connected to database. Reading CSV from: ${csvPath}`);

    const students = loadStudentsFromCsv(csvPath);
    const targetStudent = students.find((student) => student.rollNo === targetRollNo);

    console.log(`Parsed ${students.length} student rows from CSV.`);
    if (targetStudent) {
      console.log(`CSV department for ${targetRollNo}: ${targetStudent.department}`);
    } else {
      console.warn(`Warning: Roll number ${targetRollNo} not found in CSV.`);
    }

    const studentSyncResult = await syncStudents(students);
    console.log('Student sync completed.');
    console.log(`- Upserted: ${studentSyncResult.upsertedCount}`);
    console.log(`- Modified: ${studentSyncResult.modifiedCount}`);
    console.log(`- Matched: ${studentSyncResult.matchedCount}`);
    console.log(`- Deleted not in CSV: ${studentSyncResult.deletedCount}`);

    const inductionUpdateResult = await updateInductionDepartment(targetRollNo, targetDepartment);
    console.log(`Induction update completed for roll ${targetRollNo}.`);
    console.log(`- Matched induction records: ${inductionUpdateResult.matchedCount}`);
    console.log(`- Updated induction records: ${inductionUpdateResult.modifiedCount}`);
    console.log(`- Branch set to: ${targetDepartment}`);

    console.log('All requested updates completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to apply requested updates:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

main();
