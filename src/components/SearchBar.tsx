"use client";

import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  resultCount: number;
  totalCount: number;
}

export default function SearchBar({ onSearch, resultCount, totalCount }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="relative">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search papers by title, author, or topic..."
          className="search-input w-full pl-10 pr-20 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-white placeholder-gray-500 outline-none"
        />
        {query && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {resultCount}/{totalCount}
            </span>
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
