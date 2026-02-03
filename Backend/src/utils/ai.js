function parsePriority(text) {
  const normalized = text.toLowerCase();
  if (/(asap|urgent|immediately|high priority|p1|critical)/.test(normalized)) return 'High';
  if (/(low priority|p3|someday|nice to have)/.test(normalized)) return 'Low';
  return 'Medium';
}

function parseStatus(text) {
  const normalized = text.toLowerCase();
  if (/(done|completed|finished)/.test(normalized)) return 'Done';
  if (/(in progress|started|ongoing)/.test(normalized)) return 'In Progress';
  return 'Open';
}

function parseDueDate(text) {
  const normalized = text.toLowerCase();
  const now = new Date();

  if (/(today)/.test(normalized)) {
    return now.toISOString().slice(0, 10);
  }
  if (/(tomorrow)/.test(normalized)) {
    const date = new Date(now);
    date.setDate(now.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }
  const inDaysMatch = normalized.match(/in (\d{1,2}) days?/);
  if (inDaysMatch) {
    const date = new Date(now);
    date.setDate(now.getDate() + Number(inDaysMatch[1]));
    return date.toISOString().slice(0, 10);
  }
  const onDateMatch = normalized.match(/on (\d{4}-\d{2}-\d{2})/);
  if (onDateMatch) {
    return onDateMatch[1];
  }
  const slashMatch = normalized.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, '0');
    const day = slashMatch[2].padStart(2, '0');
    let year = slashMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }
  return '';
}

function parseTags(text) {
  const hashTags = text.match(/#([a-z0-9_-]+)/gi) || [];
  return Array.from(new Set(hashTags.map((tag) => tag.replace('#', '').toLowerCase())));
}

function parseSubtasks(text) {
  const lines = text.split('\n');
  const subtasks = [];
  lines.forEach((line) => {
    const match = line.match(/^-\s+(.+)/) || line.match(/^\*\s+(.+)/);
    if (match) subtasks.push(match[1].trim());
  });
  return subtasks;
}

function extractTitleAndDescription(text) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return { title: '', description: '' };
  if (lines.length === 1) return { title: lines[0], description: '' };
  return { title: lines[0], description: lines.slice(1).join('\n') };
}

function parseTaskInput(input) {
  const raw = String(input || '').trim();
  const { title, description } = extractTitleAndDescription(raw);
  const tags = parseTags(raw);
  const due_date = parseDueDate(raw);
  const priority = parsePriority(raw);
  const status = parseStatus(raw);
  const subtasks = parseSubtasks(raw);

  return {
    title,
    description,
    tags,
    due_date,
    priority,
    status,
    subtasks,
  };
}

function buildSuggestions(tasks) {
  const suggestions = [];
  const now = new Date();
  const soon = new Date(now);
  soon.setDate(now.getDate() + 3);

  tasks.forEach((task) => {
    if (task.status !== 'Done' && task.due_date) {
      const due = new Date(task.due_date);
      if (!Number.isNaN(due.valueOf()) && due <= soon) {
        suggestions.push({
          type: 'due_soon',
          title: `"${task.title}" is due soon`,
          details: `Consider scheduling focus time. Due date: ${task.due_date}.`,
          confidence: 0.72,
        });
      }
    }
    if (task.priority === 'High' && task.status === 'Open') {
      suggestions.push({
        type: 'priority',
        title: `High priority task "${task.title}" is still open`,
        details: 'Move it forward or break it into subtasks.',
        confidence: 0.6,
      });
    }
    if (!task.description || task.description.trim().length < 10) {
      suggestions.push({
        type: 'missing_context',
        title: `Add context to "${task.title}"`,
        details: 'A short description helps keep clarity during execution.',
        confidence: 0.45,
      });
    }
  });

  const openCount = tasks.filter((task) => task.status !== 'Done').length;
  if (openCount >= 8) {
    suggestions.push({
      type: 'workload',
      title: 'Backlog is growing',
      details: 'Consider closing, delegating, or deferring a few tasks.',
      confidence: 0.55,
    });
  }

  return suggestions.slice(0, 8);
}

module.exports = {
  parseTaskInput,
  buildSuggestions,
};
