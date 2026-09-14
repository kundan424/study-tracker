const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

// GET /stats - compute and return stats
router.get('/stats', async (req, res) => {
  try {
    const sessions = await Session.find().populate('subjectId');
    
    let totalMinutes = 0;
    const bySubjectMap = {};
    const dailyMap = {};
    const dateSet = new Set();
    
    // Process sessions
    sessions.forEach(session => {
      totalMinutes += session.duration;
      
      // By Subject Stats
      if (session.subjectId) {
        const subId = session.subjectId._id.toString();
        if (!bySubjectMap[subId]) {
          bySubjectMap[subId] = {
            subjectId: subId,
            name: session.subjectId.name,
            color: session.subjectId.color,
            totalMinutes: 0
          };
        }
        bySubjectMap[subId].totalMinutes += session.duration;
      }
      
      // Daily Map
      if (!dailyMap[session.date]) {
        dailyMap[session.date] = 0;
      }
      dailyMap[session.date] += session.duration;
      dateSet.add(session.date);
    });
    
    const bySubject = Object.values(bySubjectMap);
    
    // Streak calculations
    const allDates = Array.from(dateSet).sort();
    
    let longestStreak = 0;
    let currentLongestCount = 0;
    
    for (let i = 0; i < allDates.length; i++) {
      if (i === 0) {
        currentLongestCount = 1;
      } else {
        const prevDate = new Date(allDates[i - 1]);
        const currDate = new Date(allDates[i]);
        const diffTime = Math.abs(currDate - prevDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentLongestCount++;
        } else if (diffDays > 1) {
          currentLongestCount = 1;
        }
      }
      if (currentLongestCount > longestStreak) {
        longestStreak = currentLongestCount;
      }
    }
    
    // Current streak (starting from today, going backwards)
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dateSet.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (streak === 0 && dateStr === new Date().toISOString().split('T')[0]) {
        // If today has no session, we skip to yesterday without breaking
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break; // Stop at first gap
      }
    }

    // Last 30 days logic for charts
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      last30Days.push({
        date: dStr,
        totalMinutes: dailyMap[dStr] || 0
      });
    }

    res.status(200).json({
      totalMinutes,
      totalSessions: sessions.length,
      streak,
      longestStreak,
      bySubject,
      last30Days
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET / - list sessions, supports ?from=YYYY-MM-DD & ?to=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = {};
    
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }
    
    const sessions = await Session.find(query)
      .populate('subjectId', 'name color')
      .sort({ date: -1, createdAt: -1 });
      
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST / - create session
router.post('/', async (req, res) => {
  try {
    const { subjectId, date, duration, topic, notes } = req.body;
    const session = new Session({ subjectId, date, duration, topic, notes });
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /:id - delete session
router.delete('/:id', async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
