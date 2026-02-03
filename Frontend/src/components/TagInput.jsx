export default function TagInput({ value, onChange, id, label = 'Tags', placeholder }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name="tags"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || 'frontend, research, sprint'}
      />
      <span className="helper">Comma-separated labels. Example: design, api, urgent.</span>
    </div>
  );
}
