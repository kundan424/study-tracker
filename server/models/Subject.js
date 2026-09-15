const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  color: { type: String, default: '#C89B4B' },
  totalLectures: { type: Number, default: 0 },  // Total lectures in syllabus
  weeklySchedule: {
    mon: { type: Number, default: 1 },
    tue: { type: Number, default: 1 },
    wed: { type: Number, default: 1 },
    thu: { type: Number, default: 1 },
    fri: { type: Number, default: 1 },
    sat: { type: Number, default: 0 },
    sun: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subject', subjectSchema);
