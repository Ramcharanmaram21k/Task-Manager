export default function BulkActionsBar({
  selectedCount,
  onClear,
  onBulkStatus,
  onBulkPriority,
  onBulkDelete,
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-bar" role="region" aria-label="Bulk actions">
      <span>{selectedCount} selected</span>
      <div className="bulk-actions">
        <select
          onChange={(event) => {
            onBulkStatus(event.target.value);
            event.target.value = '';
          }}
          defaultValue=""
        >
          <option value="" disabled>
            Set status
          </option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
        <select
          onChange={(event) => {
            onBulkPriority(event.target.value);
            event.target.value = '';
          }}
          defaultValue=""
        >
          <option value="" disabled>
            Set priority
          </option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <button type="button" className="danger-button" onClick={onBulkDelete}>
          Delete
        </button>
        <button type="button" className="secondary-button" onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  );
}
