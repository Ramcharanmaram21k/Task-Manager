import { useId } from 'react';

export default function TaskFilters({ filters, onChange, onApply }) {
  const statusId = useId();
  const priorityId = useId();

  return (
    <div className="filters" aria-label="Task filters">
      <div className="field">
        <label htmlFor={statusId}>Status</label>
        <select
          id={statusId}
          value={filters.status}
          onChange={(event) => onChange({ status: event.target.value })}
        >
          <option value="">All</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor={priorityId}>Priority</label>
        <select
          id={priorityId}
          value={filters.priority}
          onChange={(event) => onChange({ priority: event.target.value })}
        >
          <option value="">All</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>
      <button type="button" className="secondary-button" onClick={onApply}>
        Apply filters
      </button>
    </div>
  );
}
