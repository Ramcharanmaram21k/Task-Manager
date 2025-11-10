const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Create a task
router.post('/', (req, res) => {
    const { title, description, priority, due_date } = req.body;
    if (!title || !priority || !due_date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    db.run(
        `INSERT INTO tasks (title, description, priority, due_date, status) VALUES (?, ?, ?, ?, ?)`,
        [title, description || '', priority, due_date, 'Open'],
        function (err) {
            if (err) return res.status(500).json({ error: 'Failed to create task' });
            db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err2, row) => {
                if (err2) return res.status(500).json({ error: 'Failed to fetch created task' });
                res.status(201).json(row);
            });
        }
    );
});

// Delete a task
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: "Failed to delete task" });
        if (this.changes === 0) return res.status(404).json({ error: "Task not found" });
        res.json({ success: true });
    });
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
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch tasks' });
        res.json(Array.isArray(rows) ? rows : []);
    });
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
    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: 'Failed to update task' });
        db.get('SELECT * FROM tasks WHERE id = ?', [id], (err2, updatedTask) => {
            if (err2) return res.status(500).json({ error: 'Failed to fetch updated task' });
            res.json(updatedTask);
        });
    });
});

module.exports = router;
