export default function Select({ label, children, className = "", ...props }) {
  return (
    <label className="block">
      {label && <div className="mb-1 text-sm text-neutral-400">{label}</div>}
      <select
        className={`w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700
                    text-neutral-100 outline-none focus:border-neutral-500 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
