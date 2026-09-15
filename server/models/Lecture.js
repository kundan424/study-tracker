const mongoose = require('mongoose');

// Each document represents one subject marked as "done" on a given date.
// Toggling a lecture creates/deletes this record.
const lectureSchema = new mongoose.Schema({
  date: { type: String, required: true },           // 'YYYY-MM-DD'
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  count: { type: Number, default: 1 },              // number of lectures watched on this date
  createdAt: { type: Date, default: Date.now }
});

// Ensure only one completion per subject per day
lectureSchema.index({ date: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('Lecture', lectureSchema);
