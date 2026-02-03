import AIPanel from './AIPanel';
import AISuggestions from './AISuggestions';

export default function AIInsights({ onApply }) {
  return (
    <div className="ai-grid">
      <AIPanel onApply={onApply} />
      <AISuggestions />
    </div>
  );
}
