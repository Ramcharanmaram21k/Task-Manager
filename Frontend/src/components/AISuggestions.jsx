import { useQuery } from '@tanstack/react-query';
import { fetchSuggestions } from '../api/tasks';

export default function AISuggestions() {
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: fetchSuggestions,
  });

  return (
    <section className="ai-suggestions" aria-label="AI suggestions">
      <div className="ai-header">
        <div>
          <h2>Smart Suggestions</h2>
          <p>Context-aware tips generated from your current tasks.</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => refetch()}>
          Refresh
        </button>
      </div>
      {isLoading ? (
        <p className="muted">Generating suggestions…</p>
      ) : isError ? (
        <p className="muted">Couldn’t load suggestions.</p>
      ) : data.length === 0 ? (
        <p className="muted">No suggestions right now.</p>
      ) : (
        <div className="suggestion-list">
          {data.map((item, index) => (
            <div key={`${item.type}-${index}`} className="suggestion-card">
              <strong>{item.title}</strong>
              <p>{item.details}</p>
              <span className="suggestion-meta">Confidence: {Math.round(item.confidence * 100)}%</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
