import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { parseTaskInput } from '../api/tasks';
import { useToast } from './ToastProvider';

export default function AIPanel({ onApply }) {
  const { addToast } = useToast();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);

  const parseMutation = useMutation({
    mutationFn: parseTaskInput,
    onSuccess: (data) => setResult(data),
    onError: (err) => addToast(err.message || 'Failed to parse input', { type: 'error' }),
  });

  function handleParse(event) {
    event.preventDefault();
    if (!text.trim()) return;
    parseMutation.mutate(text);
  }

  function handleApply() {
    if (!result) return;
    onApply(result);
    setResult(null);
    setText('');
  }

  return (
    <section className="ai-panel" aria-label="AI task parser">
      <div className="ai-header">
        <div>
          <h2>AI Task Parser</h2>
          <p>Paste a messy note and we’ll extract fields, tags, and subtasks.</p>
        </div>
      </div>
      <form onSubmit={handleParse} className="ai-form">
        <label className="field">
          <span>Raw input</span>
          <textarea
            rows={5}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Launch campaign next Friday #marketing\n- Draft copy\n- Review assets"
          />
        </label>
        <div className="ai-actions">
          <button type="submit" className="secondary-button" disabled={parseMutation.isPending}>
            {parseMutation.isPending ? 'Parsing…' : 'Parse'}
          </button>
          {result ? (
            <button type="button" onClick={handleApply}>
              Apply to form
            </button>
          ) : null}
        </div>
      </form>

      {result ? (
        <div className="ai-result">
          <div>
            <strong>Title</strong>
            <p>{result.title || 'Untitled'}</p>
          </div>
          <div>
            <strong>Description</strong>
            <p>{result.description || 'No description detected.'}</p>
          </div>
          <div className="ai-inline">
            <span>Priority: {result.priority}</span>
            <span>Status: {result.status}</span>
            <span>Due: {result.due_date || 'None'}</span>
          </div>
          <div>
            <strong>Tags</strong>
            <p>{result.tags?.length ? result.tags.join(', ') : 'None'}</p>
          </div>
          <div>
            <strong>Subtasks</strong>
            <p>{result.subtasks?.length ? result.subtasks.join(', ') : 'None'}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
