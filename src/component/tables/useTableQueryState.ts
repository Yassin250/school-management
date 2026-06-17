"use client";

import { parseAsInteger, parseAsString, useQueryState } from "nuqs";

export function useTableQueryState(defaultPageSize = 10) {
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("")
  );
  const [sortKey, setSortKey] = useQueryState(
    "sort",
    parseAsString.withDefault("")
  );
  const [sortDir, setSortDir] = useQueryState(
    "dir",
    parseAsString.withDefault("asc")
  );

  const resetPage = () => {
    if (page !== 1) setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value || null);
    resetPage();
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    resetPage();
  };

  return {
    page,
    search,
    sortKey,
    sortDir,
    pageSize: defaultPageSize,
    setPage: handlePageChange,
    setSearch: handleSearch,
    handleSort,
  };
}
