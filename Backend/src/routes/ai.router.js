const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { parseTaskInput, buildSuggestions } = require('../utils/ai');

router.post('/parse', (req, res) => {
  const { text } = req.body;
  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'Provide text to parse' });
  }
  const parsed = parseTaskInput(text);
  res.json(parsed);
});

router.get('/suggestions', (_req, res) => {
  db.all('SELECT * FROM tasks ORDER BY due_date ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to build suggestions' });
    const list = Array.isArray(rows) ? rows : [];
    const suggestions = buildSuggestions(list);

    const insert = db.prepare(
      'INSERT INTO ai_suggestions (type, title, details, confidence) VALUES (?, ?, ?, ?)'
    );
    suggestions.forEach((item) => {
      insert.run(item.type, item.title, item.details, item.confidence);
    });
    insert.finalize();

    res.json(suggestions);
  });
});

router.get('/suggestions/history', (_req, res) => {
  db.all(
    'SELECT * FROM ai_suggestions ORDER BY created_at DESC LIMIT 20',
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch suggestions' });
      res.json(Array.isArray(rows) ? rows : []);
    }
  );
});

module.exports = router;
