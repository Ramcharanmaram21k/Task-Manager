const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.get('/', (req, res) => {
    db.get("SELECT COUNT(*) as total FROM tasks WHERE status='Open'", (err, openRow) => {
        if (err) return res.status(500).json({ error: "Could not calculate insights" });
        const openTasks = openRow.total;
        db.get("SELECT COUNT(*) as soon FROM tasks WHERE status!='Done' AND date(due_date) <= date('now', '+3 day')", (err, dueRow) => {
            if (err) return res.status(500).json({ error: "Could not calculate insights" });
            const dueSoon = dueRow.soon;
            db.all("SELECT priority, COUNT(*) as count FROM tasks WHERE status='Open' GROUP BY priority", (err, priorityRows) => {
                if (err) return res.status(500).json({ error: "Could not calculate insights" });
                let insight = `You have ${openTasks} open tasks. `;
                if (dueSoon > 0) insight += `${dueSoon} tasks are due soon! `;
                if (priorityRows.find(p => p.priority === 'High')) {
                    insight += `High priority tasks: ${priorityRows.find(p => p.priority === 'High').count}.`;
                }
                res.json({
                    openTasks,
                    dueSoon,
                    priority: priorityRows,
                    summary: insight
                });
            });
        });
    });
});

module.exports = router;
