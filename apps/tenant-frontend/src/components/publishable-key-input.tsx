"use client";

import React, { useState } from "react";
import { Key } from "lucide-react";

export function PublishableKeyInput({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);

  const handleGenerate = (e: React.MouseEvent) => {
    e.preventDefault();
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setValue(`pk_live_${randomHex}`);
  };

  return (
    <div className="flex gap-2">
      <input
        name="publishableKey"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="pk_live_..."
        autoComplete="off"
        className="mt-1 block w-full rounded-md border border-stone-200 p-2 text-sm outline-none transition focus:border-stone-500"
      />
      <button
        onClick={handleGenerate}
        className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-700 hover:bg-stone-100 transition"
      >
        <Key size={14} />
        Generate
      </button>
    </div>
  );
}
