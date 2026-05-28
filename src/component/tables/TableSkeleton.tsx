interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export default function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div className="animate-in fade-in-0 duration-300">
      <table className="w-full">
        {/* Header */}
        {showHeader && (
          <thead>
            <tr className="border-b border-gray-100">
              {Array.from({ length: columns }, (_, i) => (
                <th key={i} className="py-3 px-4">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                </th>
              ))}
              <th className="py-3 px-4 w-20">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-16 ml-auto" />
              </th>
            </tr>
          </thead>
        )}

        {/* Body */}
        <tbody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-50">
              {Array.from({ length: columns }, (_, colIndex) => (
                <td key={colIndex} className="py-3 px-4">
                  <div
                    className="h-4 bg-gray-50 rounded animate-pulse"
                    style={{ width: `${60 + Math.random() * 30}%` }}
                  />
                </td>
              ))}
              <td className="py-3 px-4">
                <div className="flex items-center gap-2 justify-end">
                  <div className="h-8 w-8 bg-gray-50 rounded-lg animate-pulse" />
                  <div className="h-8 w-8 bg-gray-50 rounded-lg animate-pulse" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}