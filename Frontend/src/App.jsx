import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import './App.css';
import {
  bulkDeleteTasks,
  bulkUpdateTasks,
  createTask,
  deleteTask,
  fetchInsights,
  fetchTasks,
  reorderTasks,
  updateTask,
} from './api/tasks';
import { useToast } from './components/ToastProvider';
import TaskForm from './components/TaskForm';
import TaskFilters from './components/TaskFilters';
import InsightsBar from './components/InsightsBar';
import TaskList from './components/TaskList';
import TaskEditModal from './components/TaskEditModal';
import ConfirmDialog from './components/ConfirmDialog';
import SkeletonList from './components/SkeletonList';
import EmptyState from './components/EmptyState';
import SearchBar from './components/SearchBar';
import BulkActionsBar from './components/BulkActionsBar';
import AIInsights from './components/AIInsights';

const initialForm = {
  title: '',
  description: '',
  priority: 'Medium',
  due_date: '',
  tags: '',
};

export default function App() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [activeTask, setActiveTask] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const tasksQuery = useQuery({
    queryKey: ['tasks', filters, search],
    queryFn: () => fetchTasks({ ...filters, q: search }),
  });

  const insightsQuery = useQuery({
    queryKey: ['insights'],
    queryFn: fetchInsights,
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      setForm(initialForm);
      addToast('Task created', { type: 'success' });
    },
    onError: (err) => {
      setError(err.message || 'Could not create task');
      addToast('Failed to create task', { type: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      addToast('Task updated', { type: 'success' });
    },
    onError: (err) => addToast(err.message || 'Failed to update task', { type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      addToast('Task deleted', { type: 'success' });
    },
    onError: (err) => addToast(err.message || 'Failed to delete task', { type: 'error' }),
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, updates }) => bulkUpdateTasks(ids, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      addToast('Tasks updated', { type: 'success' });
      setSelectedIds([]);
    },
    onError: (err) => addToast(err.message || 'Failed to update tasks', { type: 'error' }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => bulkDeleteTasks(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      addToast('Tasks deleted', { type: 'success' });
      setSelectedIds([]);
    },
    onError: (err) => addToast(err.message || 'Failed to delete tasks', { type: 'error' }),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderTasks,
    onError: (err) => addToast(err.message || 'Failed to reorder tasks', { type: 'error' }),
  });

  const tasks = useMemo(() => (Array.isArray(tasksQuery.data) ? tasksQuery.data : []), [tasksQuery.data]);
  const hasTasks = tasks.length > 0;
  const canReorder = !filters.status && !filters.priority && !search;

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => tasks.some((task) => task.id === id)));
  }, [tasks]);

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.title || !form.due_date || !form.priority) {
      setError('Fill all required fields');
      return;
    }
    setError('');
    createMutation.mutate({
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      due_date: form.due_date,
      tags: form.tags,
    });
  }

  function handleUpdate(id, updates) {
    updateMutation.mutate({ id, updates });
  }

  function handleDeleteConfirmed() {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete.id);
    setPendingDelete(null);
  }

  function toggleSelection(taskId) {
    setSelectedIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]
    );
  }

  function handleBulkStatus(status) {
    if (!status) return;
    bulkUpdateMutation.mutate({ ids: selectedIds, updates: { status } });
  }

  function handleBulkPriority(priority) {
    if (!priority) return;
    bulkUpdateMutation.mutate({ ids: selectedIds, updates: { priority } });
  }

  function handleBulkDelete() {
    bulkDeleteMutation.mutate(selectedIds);
  }

  function handleReorder(orderedIds, orderedTasks) {
    if (!canReorder) return;
    queryClient.setQueryData(['tasks', filters, search], orderedTasks);
    reorderMutation.mutate(orderedIds);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="hero-copy">
          <p className="eyebrow">Task Manager</p>
          <h1>Plan, execute, and track work.</h1>
          <p className="subhead">Now with labels, subtasks, search, and bulk actions.</p>
          <div className="hero-tags">
            <span>Design clarity</span>
            <span>Rapid execution</span>
            <span>AI-powered prep</span>
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-metric">
            <span>Open tasks</span>
            <strong>{insightsQuery.data?.openTasks ?? 0}</strong>
          </div>
          <div className="hero-metric">
            <span>Due soon</span>
            <strong>{insightsQuery.data?.dueSoon ?? 0}</strong>
          </div>
          <div className="hero-summary">
            {insightsQuery.data?.summary || 'Your workspace is ready for the next sprint.'}
          </div>
        </div>
      </header>

      <main className="app-grid">
        <section className="left-column">
          <TaskForm
            form={form}
            error={error}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending}
          />
          <InsightsBar insights={insightsQuery.data || { summary: '' }} />
          <AIInsights
            onApply={(parsed) => {
              setForm((current) => ({
                ...current,
                title: parsed.title || current.title,
                description: parsed.description || current.description,
                priority: parsed.priority || current.priority,
                due_date: parsed.due_date || current.due_date,
                tags: parsed.tags?.join(', ') || current.tags,
              }));
            }}
          />
        </section>

        <section className="right-column" aria-label="Task list">
          <div className="section-title">
            <h2>Task runway</h2>
            <p>Focus the work that matters next.</p>
          </div>
          <SearchBar value={search} onChange={setSearch} onClear={() => setSearch('')} />
          <TaskFilters
            filters={filters}
            onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
            onApply={tasksQuery.refetch}
          />
          {!canReorder ? (
            <p className="muted">Reordering is available only when filters and search are cleared.</p>
          ) : null}

          <BulkActionsBar
            selectedCount={selectedIds.length}
            onClear={() => setSelectedIds([])}
            onBulkStatus={handleBulkStatus}
            onBulkPriority={handleBulkPriority}
            onBulkDelete={handleBulkDelete}
          />

          {tasksQuery.isLoading ? (
            <SkeletonList />
          ) : tasksQuery.isError ? (
            <EmptyState
              title="We couldn't load tasks"
              description="The backend might be offline. Try again once it's running."
              action={
                <button type="button" className="secondary-button" onClick={() => tasksQuery.refetch()}>
                  Retry
                </button>
              }
            />
          ) : !hasTasks ? (
            <EmptyState
              title="No tasks yet"
              description="Add your first task to see it appear here."
            />
          ) : (
            <TaskList
              tasks={tasks}
              onUpdate={handleUpdate}
              onDelete={(task) => setPendingDelete(task)}
              onEdit={(task) => setActiveTask(task)}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelection}
              onReorder={handleReorder}
              dragDisabled={!canReorder}
            />
          )}
        </section>
      </main>

      <TaskEditModal
        task={activeTask}
        isOpen={Boolean(activeTask)}
        onClose={() => setActiveTask(null)}
        onSave={(updates) => {
          if (!activeTask) return;
          handleUpdate(activeTask.id, updates);
          setActiveTask(null);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete this task?"
        description={
          pendingDelete ? `This will permanently remove \"${pendingDelete.title}\".` : ''
        }
        confirmText="Delete task"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
