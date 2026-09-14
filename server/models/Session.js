const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: String, required: true }, // ISO date string "YYYY-MM-DD"
  duration: { type: Number, required: true }, // minutes
  topic: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Index for fast queries by date
sessionSchema.index({ date: 1 });

module.exports = mongoose.model('Session', sessionSchema);
