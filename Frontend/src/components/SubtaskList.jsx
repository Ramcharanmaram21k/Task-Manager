import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSubtask, deleteSubtask, fetchSubtasks, updateSubtask } from '../api/tasks';
import { useToast } from './ToastProvider';

export default function SubtaskList({ taskId }) {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');

  const { data = [], isLoading } = useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: () => fetchSubtasks(taskId),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createSubtask(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTitle('');
    },
    onError: (err) => addToast(err.message || 'Failed to add subtask', { type: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ subtaskId, payload }) => updateSubtask(taskId, subtaskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => addToast(err.message || 'Failed to update subtask', { type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (subtaskId) => deleteSubtask(taskId, subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => addToast(err.message || 'Failed to delete subtask', { type: 'error' }),
  });

  function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate({ title: title.trim() });
  }

  return (
    <div className="subtasks">
      <div className="subtasks-header">
        <strong>Subtasks</strong>
        <span>{data.length}</span>
      </div>
      {isLoading ? (
        <p className="muted">Loading subtasks…</p>
      ) : data.length === 0 ? (
        <p className="muted">No subtasks yet.</p>
      ) : (
        <ul className="subtask-list">
          {data.map((subtask) => (
            <li key={subtask.id}>
              <label>
                <input
                  type="checkbox"
                  checked={subtask.status === 'Done'}
                  onChange={() =>
                    updateMutation.mutate({
                      subtaskId: subtask.id,
                      payload: { status: subtask.status === 'Done' ? 'Open' : 'Done' },
                    })
                  }
                />
                <span className={subtask.status === 'Done' ? 'done' : ''}>{subtask.title}</span>
              </label>
              <button
                type="button"
                className="ghost-button"
                onClick={() => deleteMutation.mutate(subtask.id)}
                aria-label="Delete subtask"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="subtask-form" onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a subtask"
          aria-label="Subtask title"
        />
        <button type="submit" className="secondary-button" disabled={createMutation.isPending}>
          Add
        </button>
      </form>
    </div>
  );
}
