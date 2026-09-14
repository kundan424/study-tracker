require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');

const subjectsRouter = require('./routes/subjects');
const sessionsRouter = require('./routes/sessions');
const goalsRouter = require('./routes/goals');
const tasksRouter = require('./routes/tasks');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Mount API routes
app.use('/api/subjects', subjectsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/tasks', tasksRouter);

// Catch-all route for SPA support
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Connect to DB and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

startServer();
