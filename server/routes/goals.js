const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');

// GET /today - return today's goal
router.get('/today', async (req, res) => {
  try {
    const todayISO = new Date().toISOString().split('T')[0];
    let goal = await Goal.findOne({ date: todayISO });
    
    if (!goal) {
      goal = { date: todayISO, targetMinutes: 240 }; // Default goal
    }
    
    res.status(200).json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT / - upsert goal
router.put('/', async (req, res) => {
  try {
    const { date, targetMinutes } = req.body;
    
    if (!date || targetMinutes == null) {
      return res.status(400).json({ error: 'date and targetMinutes are required' });
    }
    
    const goal = await Goal.findOneAndUpdate(
      { date },
      { targetMinutes },
      { new: true, upsert: true, runValidators: true }
    );
    
    res.status(200).json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
