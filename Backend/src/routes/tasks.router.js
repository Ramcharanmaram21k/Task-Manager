const express = require('express');
const router = express.Router();
const db = require('../db/db');

function normalizeTags(input) {
    if (!input) return [];
    if (Array.isArray(input)) {
        return Array.from(
            new Set(input.map((tag) => String(tag).trim()).filter(Boolean))
        );
    }
    return Array.from(
        new Set(
            String(input)
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
        )
    );
}

function attachTags(tasks, callback) {
    const ids = tasks.map((task) => task.id);
    if (!ids.length) {
        callback(tasks);
        return;
    }
    db.all(
        `SELECT task_tags.task_id, tags.name
         FROM task_tags
         JOIN tags ON tags.id = task_tags.tag_id
         WHERE task_tags.task_id IN (${ids.map(() => '?').join(',')})`,
        ids,
        (err, rows) => {
            if (err) return callback(tasks);
            const map = new Map();
            rows.forEach((row) => {
                if (!map.has(row.task_id)) map.set(row.task_id, []);
                map.get(row.task_id).push(row.name);
            });
            const withTags = tasks.map((task) => ({
                ...task,
                tags: map.get(task.id) || [],
            }));
            callback(withTags);
        }
    );
}

function upsertTags(tagNames, callback) {
    if (!tagNames.length) {
        callback([]);
        return;
    }
    const placeholders = tagNames.map(() => '(?)').join(',');
    db.run(`INSERT OR IGNORE INTO tags (name) VALUES ${placeholders}`, tagNames, () => {
        db.all(
            `SELECT id, name FROM tags WHERE name IN (${tagNames.map(() => '?').join(',')})`,
            tagNames,
            (err, rows) => {
                if (err) return callback([]);
                callback(rows);
            }
        );
    });
}

// Create a task
router.post('/', (req, res) => {
    const { title, description, priority, due_date, tags } = req.body;
    if (!title || !priority || !due_date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const normalizedTags = normalizeTags(tags);
    db.get('SELECT COALESCE(MAX(position), 0) + 1 AS nextPos FROM tasks', (posErr, row) => {
        if (posErr) return res.status(500).json({ error: 'Failed to create task' });
        const position = row?.nextPos || 1;
        db.run(
            `INSERT INTO tasks (title, description, priority, due_date, status, position) VALUES (?, ?, ?, ?, ?, ?)`,
            [String(title).trim(), description || '', priority, due_date, 'Open', position],
            function (err) {
                if (err) return res.status(500).json({ error: 'Failed to create task' });
                const taskId = this.lastID;
                if (!normalizedTags.length) {
                    db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err2, task) => {
                        if (err2) return res.status(500).json({ error: 'Failed to fetch created task' });
                        res.status(201).json({ ...task, tags: [] });
                    });
                    return;
                }
                upsertTags(normalizedTags, (tagRows) => {
                    const insertValues = tagRows.map((tag) => [taskId, tag.id]);
                    const placeholders = insertValues.map(() => '(?, ?)').join(',');
                    const flat = insertValues.flat();
                    db.run(
                        `INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES ${placeholders}`,
                        flat,
                        (tagErr) => {
                            if (tagErr) return res.status(500).json({ error: 'Failed to attach tags' });
                            db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err2, task) => {
                                if (err2) return res.status(500).json({ error: 'Failed to fetch created task' });
                                res.status(201).json({ ...task, tags: normalizedTags });
                            });
                        }
                    );
                });
            }
        );
    });
});

// Bulk update tasks
router.patch('/bulk', (req, res) => {
    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Provide task ids' });
    }
    const allowedPriorities = new Set(['Low', 'Medium', 'High']);
    const allowedStatuses = new Set(['Open', 'In Progress', 'Done']);
    const { status, priority } = updates || {};

    if (status !== undefined && !allowedStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
    }
    if (priority !== undefined && !allowedPriorities.has(priority)) {
        return res.status(400).json({ error: 'Invalid priority value' });
    }

    const fields = [];
    const params = [];
    if (status !== undefined) {
        fields.push('status = ?');
        params.push(status);
    }
    if (priority !== undefined) {
        fields.push('priority = ?');
        params.push(priority);
    }
    if (!fields.length) {
        return res.status(400).json({ error: 'Provide updates to apply' });
    }
    fields.push('updated_at = CURRENT_TIMESTAMP');
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id IN (${placeholders})`;
    db.run(sql, [...params, ...ids], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to update tasks' });
        res.json({ success: true, updated: this.changes });
    });
});

// Bulk delete tasks
router.delete('/bulk', (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Provide task ids' });
    }
    const placeholders = ids.map(() => '?').join(',');
    db.run(`DELETE FROM tasks WHERE id IN (${placeholders})`, ids, function (err) {
        if (err) return res.status(500).json({ error: 'Failed to delete tasks' });
        res.json({ success: true, deleted: this.changes });
    });
});

// Reorder tasks
router.patch('/reorder', (req, res) => {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        return res.status(400).json({ error: 'Provide ordered task ids' });
    }
    const stmt = db.prepare('UPDATE tasks SET position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        orderedIds.forEach((id, index) => {
            stmt.run(index + 1, id);
        });
        stmt.finalize();
        db.run('COMMIT', (err) => {
            if (err) return res.status(500).json({ error: 'Failed to reorder tasks' });
            res.json({ success: true });
        });
    });
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
    let sql = `SELECT tasks.*,
        (SELECT COUNT(*) FROM subtasks WHERE subtasks.task_id = tasks.id) AS subtask_count
        FROM tasks`;
    let params = [];
    let where = ' WHERE 1=1';
    if (req.query.status) {
        where += " AND status = ?";
        params.push(req.query.status);
    }
    if (req.query.priority) {
        where += " AND priority = ?";
        params.push(req.query.priority);
    }
    if (req.query.q) {
        const raw = String(req.query.q).trim();
        if (raw.length) {
            const match = raw
                .split(/\s+/)
                .map((term) => term.replace(/"/g, '') + '*')
                .join(' ');
            sql += ' JOIN tasks_fts ON tasks_fts.rowid = tasks.id';
            where += ' AND tasks_fts MATCH ?';
            params.push(match);
        }
    }
    sql += `${where} ORDER BY tasks.position ASC, tasks.due_date ASC`;
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch tasks' });
        const list = Array.isArray(rows) ? rows : [];
        attachTags(list, (withTags) => res.json(withTags));
    });
});

// Update a task (PATCH)
router.patch('/:id', (req, res) => {
    const id = req.params.id;
    const { title, description, priority, due_date, status, tags } = req.body;
    const allowedPriorities = new Set(['Low', 'Medium', 'High']);
    const allowedStatuses = new Set(['Open', 'In Progress', 'Done']);

    if (
        title === undefined &&
        description === undefined &&
        priority === undefined &&
        due_date === undefined &&
        status === undefined &&
        tags === undefined
    ) {
        return res.status(400).json({ error: 'Provide fields to update' });
    }

    if (priority !== undefined && !allowedPriorities.has(priority)) {
        return res.status(400).json({ error: 'Invalid priority value' });
    }
    if (status !== undefined && !allowedStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
    }
    if (title !== undefined && String(title).trim().length === 0) {
        return res.status(400).json({ error: 'Title cannot be empty' });
    }
    if (due_date !== undefined && String(due_date).trim().length === 0) {
        return res.status(400).json({ error: 'Due date cannot be empty' });
    }

    const fields = [];
    const params = [];
    if (title !== undefined) {
        fields.push('title = ?');
        params.push(String(title).trim());
    }
    if (description !== undefined) {
        fields.push('description = ?');
        params.push(description ? String(description).trim() : '');
    }
    if (priority !== undefined) {
        fields.push('priority = ?');
        params.push(priority);
    }
    if (due_date !== undefined) {
        fields.push('due_date = ?');
        params.push(due_date);
    }
    if (status !== undefined) {
        fields.push('status = ?');
        params.push(status);
    }
    fields.push('updated_at = CURRENT_TIMESTAMP');

    const normalizedTags = tags === undefined ? null : normalizeTags(tags);
    const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
    params.push(id);

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: 'Failed to update task' });
        if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });

        if (normalizedTags === null) {
            db.get('SELECT * FROM tasks WHERE id = ?', [id], (err2, updatedTask) => {
                if (err2) return res.status(500).json({ error: 'Failed to fetch updated task' });
                attachTags([updatedTask], (withTags) => res.json(withTags[0]));
            });
            return;
        }

        db.run('DELETE FROM task_tags WHERE task_id = ?', [id], (deleteErr) => {
            if (deleteErr) return res.status(500).json({ error: 'Failed to update tags' });
            if (!normalizedTags.length) {
                db.get('SELECT * FROM tasks WHERE id = ?', [id], (err2, updatedTask) => {
                    if (err2) return res.status(500).json({ error: 'Failed to fetch updated task' });
                    res.json({ ...updatedTask, tags: [] });
                });
                return;
            }
            upsertTags(normalizedTags, (tagRows) => {
                const insertValues = tagRows.map((tag) => [id, tag.id]);
                const placeholders = insertValues.map(() => '(?, ?)').join(',');
                const flat = insertValues.flat();
                db.run(
                    `INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES ${placeholders}`,
                    flat,
                    (tagErr) => {
                        if (tagErr) return res.status(500).json({ error: 'Failed to update tags' });
                        db.get('SELECT * FROM tasks WHERE id = ?', [id], (err2, updatedTask) => {
                            if (err2) return res.status(500).json({ error: 'Failed to fetch updated task' });
                            res.json({ ...updatedTask, tags: normalizedTags });
                        });
                    }
                );
            });
        });
    });
});


// Subtasks
router.get('/:id/subtasks', (req, res) => {
    db.all(
        'SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC, created_at ASC',
        [req.params.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch subtasks' });
            res.json(Array.isArray(rows) ? rows : []);
        }
    );
});

router.post('/:id/subtasks', (req, res) => {
    const { title } = req.body;
    if (!title || !String(title).trim()) {
        return res.status(400).json({ error: 'Missing subtask title' });
    }
    db.get(
        'SELECT COALESCE(MAX(position), 0) + 1 AS nextPos FROM subtasks WHERE task_id = ?',
        [req.params.id],
        (posErr, row) => {
            if (posErr) return res.status(500).json({ error: 'Failed to create subtask' });
            db.run(
                'INSERT INTO subtasks (task_id, title, position) VALUES (?, ?, ?)',
                [req.params.id, String(title).trim(), row?.nextPos || 1],
                function (err) {
                    if (err) return res.status(500).json({ error: 'Failed to create subtask' });
                    db.get('SELECT * FROM subtasks WHERE id = ?', [this.lastID], (err2, subtask) => {
                        if (err2) return res.status(500).json({ error: 'Failed to fetch subtask' });
                        res.status(201).json(subtask);
                    });
                }
            );
        }
    );
});

router.patch('/:id/subtasks/:subtaskId', (req, res) => {
    const { title, status } = req.body;
    if (title === undefined && status === undefined) {
        return res.status(400).json({ error: 'Provide fields to update' });
    }
    const fields = [];
    const params = [];
    if (title !== undefined) {
        if (!String(title).trim()) {
            return res.status(400).json({ error: 'Title cannot be empty' });
        }
        fields.push('title = ?');
        params.push(String(title).trim());
    }
    if (status !== undefined) {
        if (!['Open', 'Done'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        fields.push('status = ?');
        params.push(status);
    }
    params.push(req.params.subtaskId);
    db.run(
        `UPDATE subtasks SET ${fields.join(', ')} WHERE id = ?`,
        params,
        function (err) {
            if (err) return res.status(500).json({ error: 'Failed to update subtask' });
            if (this.changes === 0) return res.status(404).json({ error: 'Subtask not found' });
            db.get('SELECT * FROM subtasks WHERE id = ?', [req.params.subtaskId], (err2, subtask) => {
                if (err2) return res.status(500).json({ error: 'Failed to fetch subtask' });
                res.json(subtask);
            });
        }
    );
});

router.delete('/:id/subtasks/:subtaskId', (req, res) => {
    db.run('DELETE FROM subtasks WHERE id = ?', [req.params.subtaskId], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to delete subtask' });
        if (this.changes === 0) return res.status(404).json({ error: 'Subtask not found' });
        res.json({ success: true });
    });
});

// Tags list
router.get('/tags/all', (_req, res) => {
    db.all('SELECT * FROM tags ORDER BY name ASC', (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch tags' });
        res.json(Array.isArray(rows) ? rows : []);
    });
});

module.exports = router;
