const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const Session = require('../models/Session');
const Lecture = require('../models/Lecture');

// GET / - find all subjects, sorted by createdAt
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: 1 });
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST / - create new subject
router.post('/', async (req, res) => {
  try {
    const { name, color, totalLectures, weeklySchedule } = req.body;
    const subjectData = { name, color, totalLectures: totalLectures || 0 };
    if (weeklySchedule) subjectData.weeklySchedule = weeklySchedule;
    const subject = new Subject(subjectData);
    await subject.save();
    res.status(201).json(subject);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /:id - update subject
router.put('/:id', async (req, res) => {
  try {
    const { name, color, totalLectures, weeklySchedule } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (totalLectures !== undefined) updateData.totalLectures = totalLectures;
    if (weeklySchedule !== undefined) updateData.weeklySchedule = weeklySchedule;

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.status(200).json(subject);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /:id - delete subject AND all associated data
router.delete('/:id', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    // Delete all sessions and lectures associated with this subject
    await Session.deleteMany({ subjectId: req.params.id });
    await Lecture.deleteMany({ subjectId: req.params.id });
    res.status(200).json({ message: 'Subject and related data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
