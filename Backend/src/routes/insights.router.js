const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.get('/', (req, res) => {
    // Simple insights
    try {
        const openTasks = db.prepare(`SELECT COUNT(*) as total FROM tasks WHERE status='Open'`).get().total;
        const dueSoon = db.prepare(`SELECT COUNT(*) as soon FROM tasks WHERE status!='Done' AND date(due_date) <= date('now', '+3 day')`).get().soon;
        const priority = db.prepare(`SELECT priority, COUNT(*) as count FROM tasks WHERE status='Open' GROUP BY priority`).all();
        let insight = `You have ${openTasks} open tasks. `;
        if (dueSoon > 0) insight += `${dueSoon} tasks are due soon! `;
        if (priority.find(p => p.priority === 'High')) {
            insight += `High priority tasks: ${priority.find(p => p.priority === 'High').count}.`;
        }
        res.json({
            openTasks,
            dueSoon,
            priority,
            summary: insight
        });
    } catch (err) {
        res.status(500).json({ error: 'Could not calculate insights' });
    }
});

module.exports = router;
