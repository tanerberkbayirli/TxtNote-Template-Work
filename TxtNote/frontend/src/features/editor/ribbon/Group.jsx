export default function Group({ label, children, className = "" }) {
  return (
    <div role="group" aria-label={label} className={`thesis-ribbon-group ${className}`}>
      <div className="thesis-ribbon-group-content">{children}</div>
      <span>{label}</span>
    </div>
  );
}
