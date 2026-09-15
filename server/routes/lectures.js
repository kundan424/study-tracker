const express = require('express');
const router = express.Router();
const Lecture = require('../models/Lecture');
const Subject = require('../models/Subject');

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// GET /stats - stats for progress bars and graphs
router.get('/stats', async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: 1 });
    const lectures = await Lecture.find();

    // Count completions per subject summing count
    const bySubject = subjects.map(s => {
      const subId = s._id.toString();
      const done = lectures
        .filter(l => l.subjectId.toString() === subId)
        .reduce((sum, l) => sum + (l.count || 1), 0);

      return {
        _id: subId,
        name: s.name,
        color: s.color,
        total: s.totalLectures || 0,
        weeklySchedule: s.weeklySchedule || { mon: 1, tue: 1, wed: 1, thu: 1, fri: 1, sat: 0, sun: 0 },
        done
      };
    });

    const overallDone = bySubject.reduce((sum, s) => sum + s.done, 0);
    const overallTotal = bySubject.reduce((sum, s) => sum + s.total, 0);

    // Daily counts for last 30 days
    const dailyMap = {};
    lectures.forEach(l => {
      dailyMap[l.date] = (dailyMap[l.date] || 0) + (l.count || 1);
    });

    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toLocaleDateString('en-CA');
      const dayKey = DAY_KEYS[d.getDay()];

      // Calculate scheduled target for this specific weekday
      const dayTarget = subjects.reduce((sum, s) => {
        const sched = s.weeklySchedule || {};
        return sum + (sched[dayKey] || 0);
      }, 0);

      last30Days.push({
        date: dStr,
        dayKey,
        count: dailyMap[dStr] || 0,
        target: dayTarget
      });
    }

    // Today's scheduled target
    const today = new Date();
    const todayKey = DAY_KEYS[today.getDay()];
    const todayTarget = subjects.reduce((sum, s) => {
      const sched = s.weeklySchedule || {};
      return sum + (sched[todayKey] || 0);
    }, 0);
    const todayDateStr = today.toLocaleDateString('en-CA');
    const todayDone = dailyMap[todayDateStr] || 0;

    res.status(200).json({
      overallDone,
      overallTotal,
      todayTarget,
      todayDone,
      bySubject,
      last30Days
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /day/:date - get completions for a specific date
router.get('/day/:date', async (req, res) => {
  try {
    const lectures = await Lecture.find({ date: req.params.date });
    const completions = {};
    lectures.forEach(l => {
      completions[l.subjectId.toString()] = {
        done: true,
        count: l.count || 1
      };
    });
    res.status(200).json(completions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /days - get dates that have at least one lecture
router.get('/days', async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = {};
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }
    const lectures = await Lecture.find(query, 'date subjectId count');
    const days = {};
    lectures.forEach(l => {
      if (!days[l.date]) days[l.date] = [];
      days[l.date].push(l.subjectId.toString());
    });
    res.status(200).json(days);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /toggle - toggle or update a lecture count for a subject on a date
router.post('/toggle', async (req, res) => {
  try {
    const { subjectId, date, count } = req.body;
    if (!subjectId || !date) {
      return res.status(400).json({ error: 'subjectId and date are required' });
    }

    const existing = await Lecture.findOne({ subjectId, date });

    if (count !== undefined) {
      // Explicit count provided
      if (count <= 0) {
        if (existing) await Lecture.findByIdAndDelete(existing._id);
        return res.status(200).json({ done: false, count: 0 });
      } else {
        if (existing) {
          existing.count = count;
          await existing.save();
          return res.status(200).json({ done: true, count, lecture: existing });
        } else {
          const lecture = new Lecture({ subjectId, date, count });
          await lecture.save();
          return res.status(201).json({ done: true, count, lecture });
        }
      }
    }

    // Default toggle behavior
    if (existing) {
      await Lecture.findByIdAndDelete(existing._id);
      res.status(200).json({ done: false, count: 0 });
    } else {
      const lecture = new Lecture({ subjectId, date, count: 1 });
      await lecture.save();
      res.status(201).json({ done: true, count: 1, lecture });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
