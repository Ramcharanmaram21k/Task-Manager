// Simple express setup for the backend
const express = require('express');
const cors = require('cors');
const tasksRouter = require('./src/routes/tasks.router');


const app = express();
const PORT = 3001; // Using 3001 so frontend (Vite) can run on 5173

// Middlewares
app.use(express.json());
app.use(cors());

// Health check endpoint
app.get('/', (req, res) => {
    res.send('Task Manager API is running 👍');
});

// Task routes
app.use('/tasks', tasksRouter);

// (A placeholder for insights; expand later if required)
app.use('/insights', require('./src/routes/insights.router'));

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
