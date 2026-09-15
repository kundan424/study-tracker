const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');

// GET /today - return today's goal
router.get('/today', async (req, res) => {
  try {
    const todayISO = new Date().toISOString().split('T')[0];
    let goal = await Goal.findOne({ date: todayISO });
    
    if (!goal) {
      goal = { date: todayISO, targetMinutes: 240, targetLectures: 2 }; // Default goal
    }
    
    res.status(200).json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT / - upsert goal
router.put('/', async (req, res) => {
  try {
    const { date, targetMinutes, targetLectures } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    const updateData = {};
    if (targetMinutes !== undefined) updateData.targetMinutes = targetMinutes;
    if (targetLectures !== undefined) updateData.targetLectures = targetLectures;

    const goal = await Goal.findOneAndUpdate(
      { date },
      updateData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    res.status(200).json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
