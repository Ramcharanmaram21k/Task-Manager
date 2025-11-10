const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Create a task
const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.post('/', (req, res) => {
    const { title, description, priority, due_date } = req.body;
    if (!title || !priority || !due_date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        // Ensure 'status' field is always set to "Open"
        const stmt = db.prepare(`
            INSERT INTO tasks (title, description, priority, due_date, status)
            VALUES (?, ?, ?, ?, ?)
        `);
        const info = stmt.run(title, description || '', priority, due_date, 'Open');
        const newTask = db.prepare('SELECT * FROM tasks WHERE id=?').get(info.lastInsertRowid);
        res.status(201).json(newTask);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// The rest of your routes remain as before, including the Array.isArray(tasks) fix!

// Delete a task
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    try {
        const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
        if (result.changes === 0) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete task" });
    }
});

// Fetch all tasks (with optional filter/sort)
router.get('/', (req, res) => {
    let sql = "SELECT * FROM tasks WHERE 1=1";
    let params = [];
    if (req.query.status) {
        sql += " AND status = ?";
        params.push(req.query.status);
    }
    if (req.query.priority) {
        sql += " AND priority = ?";
        params.push(req.query.priority);
    }
    sql += " ORDER BY due_date ASC";
    try {
        const tasks = db.prepare(sql).all(...params);
        // Ensures backend **ALWAYS** returns an array (never an object)
        res.json(Array.isArray(tasks) ? tasks : []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Update a task (PATCH)
router.patch('/:id', (req, res) => {
    const id = req.params.id;
    const { status, priority } = req.body;
    if (!status && !priority) {
        return res.status(400).json({ error: 'Provide status or priority to update' });
    }
    let sql = 'UPDATE tasks SET';
    let params = [];
    if (status) {
        sql += ' status = ?';
        params.push(status);
    }
    if (priority) {
        if (params.length) sql += ',';
        sql += ' priority = ?';
        params.push(priority);
    }
    sql += ' WHERE id = ?';
    params.push(id);

    try {
        db.prepare(sql).run(...params);
        const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
        res.json(updatedTask);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

module.exports = router;
