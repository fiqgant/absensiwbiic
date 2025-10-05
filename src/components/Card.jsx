export default function Card({ title, right, children }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}
