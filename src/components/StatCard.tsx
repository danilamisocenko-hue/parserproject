import React from "react";

export function StatCard({ title, value, icon }: { title: string, value: any, icon: any }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 transition-all hover:border-neutral-700">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{title}</h4>
        <div className="bg-neutral-800 p-2 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tighter text-neutral-100">{value}</div>
    </div>
  );
}
