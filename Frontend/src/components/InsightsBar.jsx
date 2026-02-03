export default function InsightsBar({ insights }) {
  return (
    <section className="insight-bar" aria-label="Task insights">
      <div className="insight-header">
        <strong>Insights</strong>
      </div>
      <p>{insights.summary || 'No insights yet. Add a task to see analytics.'}</p>
      {Array.isArray(insights.priority) && insights.priority.length > 0 ? (
        <div className="insight-grid">
          {insights.priority.map((item) => (
            <div key={item.priority} className="insight-chip">
              <span className="chip-label">{item.priority}</span>
              <span className="chip-value">{item.count}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
