'use client';

import React from 'react';

export function InfoTooltip({ text }: { text: string }) {
  return (
    <div className="relative group cursor-help inline-block">
      <span className="ml-1 text-slate-400 text-sm">ⓘ</span>

      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 
        opacity-0 group-hover:opacity-100 transition 
        bg-slate-900 text-slate-200 text-xs p-3 rounded shadow-lg border border-slate-700 z-50">

        {text}

        <div className="absolute top-full left-1/2 -translate-x-1/2 
          border-8 border-transparent border-t-slate-900" />
      </div>
    </div>
  );
}