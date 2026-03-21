import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  rollNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  department: { type: String },
  section: { type: String }
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

export default Student;
