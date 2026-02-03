const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('task_manager.db');

function ensureColumn(table, column, definition, callback) {
  db.all(`PRAGMA table_info(${table})`, (err, rows) => {
    if (err) return callback?.(err);
    const hasColumn = rows.some((row) => row.name === column);
    if (!hasColumn) {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (alterErr) => {
        callback?.(alterErr || null);
      });
      return;
    }
    callback?.(null);
  });
}

db.ready = new Promise((resolve, reject) => {
  db.serialize(() => {
    db.exec(
      `
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')) NOT NULL DEFAULT 'Medium',
        due_date TEXT NOT NULL,
        status TEXT CHECK(status IN ('Open', 'In Progress', 'Done')) NOT NULL DEFAULT 'Open',
        position INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `,
      (taskErr) => {
        if (taskErr) return reject(taskErr);

        ensureColumn('tasks', 'position', 'INTEGER NOT NULL DEFAULT 0', (posErr) => {
          if (posErr) return reject(posErr);
          db.exec(`UPDATE tasks SET position = id WHERE position = 0`);

          ensureColumn('tasks', 'updated_at', 'DATETIME', (updateErr) => {
            if (updateErr) return reject(updateErr);
            db.exec(`UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL`);

            db.exec(
              `
              CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              );

              CREATE TABLE IF NOT EXISTS task_tags (
                task_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL,
                PRIMARY KEY (task_id, tag_id),
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
              );

              CREATE TABLE IF NOT EXISTS subtasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                status TEXT CHECK(status IN ('Open', 'Done')) NOT NULL DEFAULT 'Open',
                position INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
              );

              CREATE TABLE IF NOT EXISTS ai_suggestions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                details TEXT,
                confidence REAL NOT NULL DEFAULT 0.5,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              );
            `,
              (extraErr) => {
                if (extraErr) return reject(extraErr);

                db.exec(
                  `
                  CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts5(
                    title,
                    description,
                    content='tasks',
                    content_rowid='id'
                  );

                  CREATE TRIGGER IF NOT EXISTS tasks_ai AFTER INSERT ON tasks BEGIN
                    INSERT INTO tasks_fts(rowid, title, description) VALUES (new.id, new.title, new.description);
                  END;
                  CREATE TRIGGER IF NOT EXISTS tasks_ad AFTER DELETE ON tasks BEGIN
                    INSERT INTO tasks_fts(tasks_fts, rowid, title, description) VALUES('delete', old.id, old.title, old.description);
                  END;
                  CREATE TRIGGER IF NOT EXISTS tasks_au AFTER UPDATE ON tasks BEGIN
                    INSERT INTO tasks_fts(tasks_fts, rowid, title, description) VALUES('delete', old.id, old.title, old.description);
                    INSERT INTO tasks_fts(rowid, title, description) VALUES (new.id, new.title, new.description);
                  END;
                `,
                  (ftsErr) => {
                    if (ftsErr) return reject(ftsErr);
                    db.exec(`INSERT INTO tasks_fts(tasks_fts) VALUES('rebuild');`, (rebuildErr) => {
                      if (rebuildErr) return reject(rebuildErr);
                      resolve();
                    });
                  }
                );
              }
            );
          });
        });
      }
    );
  });
});

module.exports = db;
