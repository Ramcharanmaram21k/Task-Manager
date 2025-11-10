// server.js (or index.js)
const express = require("express");
const cors = require("cors");

const tasksRouter = require("./src/routes/tasks.router");
const insightsRouter = require("./src/routes/insights.router");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());


// Allow your frontend in prod and local dev in dev
app.use(
    cors({
        origin: [
            "http://localhost:5173",                 // Vite dev
            "https://task-manager-f-iota.vercel.app"
        ],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true
    })
);

// Health
app.get("/", (_req, res) => {
    res.send("Task Manager API is running 👍");
});

// Routes
app.use("/tasks", tasksRouter);
app.use("/insights", insightsRouter);

// Start
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
