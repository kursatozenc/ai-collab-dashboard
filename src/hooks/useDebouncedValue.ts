"use client";

import { useState, useEffect } from "react";

/**
 * Returns a value that updates only after `delayMs` of the source value not changing.
 * Keeps inputs responsive while deferring heavy work (e.g. filtering) until the user pauses.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
