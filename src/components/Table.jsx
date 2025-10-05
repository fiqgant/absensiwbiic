export function Table({ columns = [], rows = [], renderActions }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-neutral-300">
            {columns.map((c) => (
              <th
                key={c.key}
                className="text-left font-medium py-2 px-3 border-b border-neutral-800"
              >
                {c.header}
              </th>
            ))}
            {renderActions && (
              <th className="py-2 px-3 border-b border-neutral-800"></th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i} className="hover:bg-neutral-900/50">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className="py-2 px-3 border-b border-neutral-900"
                >
                  {c.render ? c.render(r[c.key], r) : r[c.key]}
                </td>
              ))}
              {renderActions && (
                <td className="py-2 px-3 border-b border-neutral-900">
                  {renderActions(r)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
