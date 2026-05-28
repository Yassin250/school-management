"use client";

import { Search, X } from "lucide-react";
import { useState, useRef } from "react";

type Props = {
  placeholder?: string;
  onSearch?: (value: string) => void;
};

export default function TableSearch({ placeholder = "Search...", onSearch }: Props) {
  const [value, setValue] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onSearch?.(val);
    }, 300);
  };

  const handleClear = () => {
    setValue("");
    onSearch?.("");
  };

  return (
    <div className="relative w-full md:w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-8 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {value && (
        <button onClick={handleClear} className="absolute right-2 top-1/2 -translate-y-1/2">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  );
}