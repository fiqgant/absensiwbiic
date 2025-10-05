export default function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700
                  active:bg-neutral-600 text-neutral-100 border border-neutral-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
