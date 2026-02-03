export default function TagList({ tags }) {
  if (!tags || tags.length === 0) {
    return <span className="tag tag-empty">No tags</span>;
  }

  return (
    <div className="tag-list" aria-label="Tags">
      {tags.map((tag) => (
        <span key={tag} className="tag">
          {tag}
        </span>
      ))}
    </div>
  );
}
