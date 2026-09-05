export default function SectionHeader({ title, sub }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {sub && (
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}
