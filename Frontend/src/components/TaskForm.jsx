import { useId } from 'react';
import TagInput from './TagInput';

export default function TaskForm({ form, error, onChange, onSubmit, isSubmitting }) {
  const titleId = useId();
  const descriptionId = useId();
  const priorityId = useId();
  const dueDateId = useId();
  const tagsId = useId();

  return (
    <form className="task-form" onSubmit={onSubmit} aria-label="Create task">
      <div className="field">
        <label htmlFor={titleId}>Title</label>
        <input
          id={titleId}
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="Plan the product roadmap"
          required
        />
      </div>
      <div className="field">
        <label htmlFor={descriptionId}>Description</label>
        <textarea
          id={descriptionId}
          name="description"
          value={form.description}
          onChange={onChange}
          rows={3}
          placeholder="Add any details or notes"
        />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor={priorityId}>Priority</label>
          <select id={priorityId} name="priority" value={form.priority} onChange={onChange} required>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={dueDateId}>Due date</label>
          <input
            id={dueDateId}
            type="date"
            name="due_date"
            value={form.due_date}
            onChange={onChange}
            required
          />
        </div>
      </div>
      <TagInput
        id={tagsId}
        value={form.tags}
        onChange={(value) => onChange({ target: { name: 'tags', value } })}
      />
      <div className="form-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding…' : 'Add Task'}
        </button>
        {error ? (
          <div className="error" role="alert" aria-live="assertive">
            {error}
          </div>
        ) : null}
      </div>
    </form>
  );
}
