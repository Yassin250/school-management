import { ReactNode } from "react";

type Column = {
  header: string;
  accessor: string;
  className?: string;
};

type Props<T> = {
  columns: Column[];
  renderRow: (item: T) => ReactNode;
  data: T[];
};

export default function Table<T>({ columns, renderRow, data }: Props<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            {columns.map((col) => (
              <th
                key={col.accessor}
                className={`text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-sm text-gray-400">
                No data found.
              </td>
            </tr>
          ) : (
            data.map((item, index) => renderRow(item))
          )}
        </tbody>
      </table>
    </div>
  );
}