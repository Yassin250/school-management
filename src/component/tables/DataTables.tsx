"use client";

import { useState, useMemo } from "react";
import { Pencil, Trash2, Eye } from "lucide-react";
import SearchInput from "@/component/tables/SearchInput";
import Pagination from "@/component/tables/Pagination";
import EmptyState from "@/component/tables/EmptyState";
import TableSkeleton from "@/component/tables/TableSkeleton";
import ConfirmDelete from "@/component/tables/ConfirmDelete";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  pageSize?: number;
  emptyState?: {
    icon?: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
  };
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;          // <-- added
  onRowClick?: (row: T) => void;
  deleteConfirmTitle?: string;
  deleteConfirmDescription?: string;
  getItemName?: (row: T) => string;
}

export default function DataTable<T extends { id: string | number }>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder = "Search...",
  searchFields = [],
  pageSize = 10,
  emptyState,
  onEdit,
  onDelete,
  onView,                             // <-- destructured
  onRowClick,
  deleteConfirmTitle = "Confirm Delete",
  deleteConfirmDescription = "This action cannot be undone.",
  getItemName,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });

  // Filtering
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || searchFields.length === 0) return data;

    return data.filter((row) =>
      searchFields.some((field) => {
        const value = row[field];
        if (typeof value === "string") {
          return value.toLowerCase().includes(searchQuery.toLowerCase());
        }
        if (typeof value === "number") {
          return value.toString().includes(searchQuery);
        }
        return false;
      })
    );
  }, [data, searchQuery, searchFields]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when search changes
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Sort handler
  const handleSort = (key: keyof T) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const hasActions = !!(onEdit || onDelete || onView); // <-- updated condition

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <SearchInput placeholder={searchPlaceholder} onSearch={() => {}} />
        </div>
        <TableSkeleton rows={pageSize} columns={columns.length + (hasActions ? 1 : 0)} />
      </div>
    );
  }

  // Empty state
  if (data.length === 0 && !isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <EmptyState
          icon={emptyState?.icon}
          title={emptyState?.title || "No data found"}
          description={emptyState?.description || ""}
          actionLabel={emptyState?.actionLabel}
          actionHref={emptyState?.actionHref}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-100">
        <SearchInput
          placeholder={searchPlaceholder}
          onSearch={handleSearch}
          className="max-w-md"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {columns.map((col, i) => (
                <th
                  key={i}
                  onClick={() => col.sortable && handleSort(col.accessor as keyof T)}
                  className={`text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                    col.sortable ? "cursor-pointer hover:text-gray-700 select-none" : ""
                  } ${col.className || ""}`}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortConfig.key === col.accessor && (
                      <span className="text-blue-500">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {hasActions && (
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {paginatedData.length === 0 && searchQuery ? (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="py-12"
                >
                  <EmptyState
                    title="No results found"
                    description={`No results for "${searchQuery}". Try a different search term.`}
                  />
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-gray-50/50 transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {columns.map((col, i) => (
                    <td
                      key={i}
                      className={`py-3 px-4 text-sm text-gray-700 ${col.className || ""}`}
                    >
                      {typeof col.accessor === "function"
                        ? col.accessor(row)
                        : (row[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {onView && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onView(row);
                            }}
                            className="p-1.5 rounded-lg hover:bg-sky-50 text-gray-400 hover:text-sky-600 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(row);
                            }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(row);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginatedData.length > 0 && (
        <div className="border-t border-gray-100">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredData.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDelete
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDelete?.(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        title={deleteConfirmTitle}
        description={deleteConfirmDescription}
        itemName={deleteTarget ? getItemName?.(deleteTarget) : undefined}
      />
    </div>
  );
}