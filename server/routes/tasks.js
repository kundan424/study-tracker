const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// GET / - find all tasks, populate subjectId, sort by completed (false first), then createdAt desc
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('subjectId')
      .sort({ completed: 1, createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST / - create task
router.post('/', async (req, res) => {
  try {
    const { title, subjectId } = req.body;
    const task = new Task({ title, subjectId });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /:id - update task
router.put('/:id', async (req, res) => {
  try {
    const { title, completed, subjectId } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, completed, subjectId },
      { new: true, runValidators: true }
    );
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /:id - delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
