export function Stats({ items }: { items: { label: string; value: string; note?: string }[] }) {
  return (
    <div className="stats">
      {items.map((i) => (
        <div key={i.label} className="stat">
          <span>{i.label}</span>
          <strong>{i.value}</strong>
          {i.note && <small>{i.note}</small>}
        </div>
      ))}
    </div>
  );
}
