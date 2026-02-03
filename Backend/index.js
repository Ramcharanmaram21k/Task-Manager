
const express = require("express");
const cors = require("cors");

const tasksRouter = require("./src/routes/tasks.router");
const insightsRouter = require("./src/routes/insights.router");
const aiRouter = require("./src/routes/ai.router");
const db = require("./src/db/db");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());


// Allow your frontend in prod and local dev in dev
const isDev = process.env.NODE_ENV !== "production";
const allowedOrigins = [
    "https://task-manager-tau-ivory.vercel.app",
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
            if (/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) return callback(null, true);
            if (isDev) return callback(null, true);
            return callback(new Error("Not allowed by CORS"));
        },
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
app.use("/ai", aiRouter);

// Start (wait for DB migrations)
db.ready
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to initialize database", err);
        process.exit(1);
    });
