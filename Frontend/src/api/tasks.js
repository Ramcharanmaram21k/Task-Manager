const API_BASE = import.meta.env.VITE_API_BASE;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function fetchTasks(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.q) params.append('q', filters.q);
  const query = params.toString();
  return request(`/tasks${query ? `?${query}` : ''}`);
}

export function fetchInsights() {
  return request('/insights');
}

export function createTask(payload) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTask(id, payload) {
  return request(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteTask(id) {
  return request(`/tasks/${id}`, {
    method: 'DELETE',
  });
}

export function bulkUpdateTasks(ids, updates) {
  return request('/tasks/bulk', {
    method: 'PATCH',
    body: JSON.stringify({ ids, updates }),
  });
}

export function bulkDeleteTasks(ids) {
  return request('/tasks/bulk', {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
  });
}

export function reorderTasks(orderedIds) {
  return request('/tasks/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ orderedIds }),
  });
}

export function fetchSubtasks(taskId) {
  return request(`/tasks/${taskId}/subtasks`);
}

export function createSubtask(taskId, payload) {
  return request(`/tasks/${taskId}/subtasks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateSubtask(taskId, subtaskId, payload) {
  return request(`/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteSubtask(taskId, subtaskId) {
  return request(`/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: 'DELETE',
  });
}

export function fetchTags() {
  return request('/tasks/tags/all');
}

export function parseTaskInput(text) {
  return request('/ai/parse', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export function fetchSuggestions() {
  return request('/ai/suggestions');
}
