import { useEffect, useMemo, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TagList from './TagList';
import SubtaskList from './SubtaskList';

const STATUS_OPTIONS = ['Open', 'In Progress', 'Done'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];

export default function TaskCard({
  task,
  onUpdate,
  onDelete,
  onEdit,
  isSelected,
  onToggleSelect,
  dragDisabled = false,
}) {
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [draft, setDraft] = useState({ title: task.title, description: task.description || '' });
  const [showSubtasks, setShowSubtasks] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: dragDisabled,
  });

  const statusBadgeClass = useMemo(() => {
    if (task.status === 'Done') return 'status-badge done';
    if (task.status === 'In Progress') return 'status-badge in-progress';
    return 'status-badge open';
  }, [task.status]);

  const priorityClass = useMemo(() => `priority-${task.priority.toLowerCase()}`, [task.priority]);

  useEffect(() => {
    if (!isInlineEditing) {
      setDraft({ title: task.title, description: task.description || '' });
    }
  }, [task.title, task.description, isInlineEditing]);

  function startInlineEdit() {
    setDraft({ title: task.title, description: task.description || '' });
    setIsInlineEditing(true);
  }

  function cancelInlineEdit() {
    setDraft({ title: task.title, description: task.description || '' });
    setIsInlineEditing(false);
  }

  function saveInlineEdit() {
    onUpdate(task.id, {
      title: draft.title,
      description: draft.description,
    });
    setIsInlineEditing(false);
  }

  const canSaveInline = draft.title.trim().length > 0;

  // Get next logical status action
  const getNextStatusAction = () => {
    if (task.status === 'Open') return { status: 'In Progress', label: 'Start' };
    if (task.status === 'In Progress') return { status: 'Done', label: 'Complete' };
    return { status: 'Open', label: 'Reopen' };
  };

  const nextAction = getNextStatusAction();

  return (
    <article
      className={`task-card ${priorityClass} ${isDragging ? 'dragging' : ''}`}
      role="listitem"
      aria-label={`Task ${task.title}`}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className="task-header">
        <div className="task-select">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(task.id)}
            aria-label={`Select ${task.title}`}
          />
          <button
            type="button"
            className="drag-handle"
            {...attributes}
            {...listeners}
            aria-label={dragDisabled ? 'Reordering disabled' : 'Drag to reorder'}
            disabled={dragDisabled}
          >
            ⋮⋮
          </button>
        </div>

        <div className="task-content">
          {isInlineEditing ? (
            <input
              className="inline-input"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              aria-label="Edit task title"
              autoFocus
            />
          ) : (
            <h3 className="task-title">{task.title}</h3>
          )}

          <div className="task-badges">
            <span className={statusBadgeClass}>{task.status}</span>
            <span className={`priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
          </div>
        </div>
      </div>

      {isInlineEditing ? (
        <textarea
          className="inline-textarea"
          rows={2}
          value={draft.description}
          onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          aria-label="Edit task description"
        />
      ) : task.description ? (
        <p className="task-description">{task.description}</p>
      ) : null}

      <TagList tags={task.tags} />

      <div className="task-details">
        <span>📅 {task.due_date}</span>
        {(task.subtask_count || 0) > 0 && (
          <span className="subtask-count">📋 {task.subtask_count} subtasks</span>
        )}
      </div>

      <div className="task-actions">
        <div className="action-group">
          {/* Primary action - next logical status */}
          <button
            type="button"
            className={task.status === 'In Progress' ? '' : 'secondary-button'}
            onClick={() => onUpdate(task.id, { status: nextAction.status })}
          >
            {nextAction.label}
          </button>

          {/* Priority quick toggle */}
          <select
            className="priority-select"
            value={task.priority}
            onChange={(e) => onUpdate(task.id, { priority: e.target.value })}
            aria-label="Change priority"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="action-group">
          {isInlineEditing ? (
            <>
              <button type="button" className="ghost-button" onClick={cancelInlineEdit}>
                Cancel
              </button>
              <button type="button" onClick={saveInlineEdit} disabled={!canSaveInline}>
                Save
              </button>
            </>
          ) : (
            <>
              <button type="button" className="ghost-button" onClick={startInlineEdit}>
                ✏️ Quick Edit
              </button>
              <button type="button" className="secondary-button" onClick={() => onEdit(task)}>
                Edit
              </button>
            </>
          )}
          <button
            type="button"
            className="icon-button danger"
            onClick={() => onDelete(task)}
            aria-label={`Delete ${task.title}`}
          >
            🗑️
          </button>
        </div>
      </div>

      {(task.subtask_count || 0) > 0 && (
        <button
          type="button"
          className="ghost-button subtask-toggle"
          onClick={() => setShowSubtasks((current) => !current)}
          aria-expanded={showSubtasks}
        >
          {showSubtasks ? '▼ Hide subtasks' : '▶ Show subtasks'}
        </button>
      )}

      {showSubtasks && <SubtaskList taskId={task.id} />}
    </article>
  );
}
