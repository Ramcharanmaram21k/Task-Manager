import { useEffect, useId, useRef, useState } from 'react';
import Modal from './Modal';
import TagInput from './TagInput';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];
const STATUS_OPTIONS = ['Open', 'In Progress', 'Done'];

export default function TaskEditModal({ task, isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    due_date: '',
    status: 'Open',
    tags: '',
  });
  const tagsId = useId();
  const titleRef = useRef(null);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'Medium',
        due_date: task.due_date || '',
        status: task.status || 'Open',
        tags: Array.isArray(task.tags) ? task.tags.join(', ') : '',
      });
    }
  }, [task]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      due_date: form.due_date,
      status: form.status,
      tags: form.tags,
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Edit task"
      description="Update the task details and save to apply changes."
      onClose={onClose}
      initialFocusRef={titleRef}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Title</span>
          <input
            ref={titleRef}
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
          />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Priority</span>
            <select name="priority" value={form.priority} onChange={handleChange}>
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Due date</span>
            <input type="date" name="due_date" value={form.due_date} onChange={handleChange} required />
          </label>
        </div>
        <label className="field">
          <span>Status</span>
          <select name="status" value={form.status} onChange={handleChange}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <TagInput
          id={tagsId}
          value={form.tags}
          onChange={(value) => setForm((current) => ({ ...current, tags: value }))}
        />
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit">Save changes</button>
        </div>
      </form>
    </Modal>
  );
}
