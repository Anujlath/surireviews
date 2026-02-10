"use client";

import { useMemo, useRef, useState } from 'react';

export default function CategorySearch({ initialValue = '', suggestions = [] }) {
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return [];
    return suggestions
      .filter((name) => name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [value, suggestions]);

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        name="q"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder="Search categories"
        className="h-11 w-full rounded-md border bg-white px-3 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border bg-white p-2 shadow-lg">
          {filtered.map((name) => (
            <button
              key={name}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setValue(name);
                if (inputRef.current) inputRef.current.focus();
              }}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
