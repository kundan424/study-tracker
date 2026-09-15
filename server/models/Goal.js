const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },  // ISO date string
  targetMinutes: { type: Number, required: true, default: 240 },
  targetLectures: { type: Number, required: true, default: 2 }
});

module.exports = mongoose.model('Goal', goalSchema);
