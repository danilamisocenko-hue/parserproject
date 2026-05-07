import React from "react";
import { cn } from "../lib/utils";

export function NavItem({ active, onClick, icon, label, count }: { active: boolean, onClick: () => void, icon: any, label: string, count?: number }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
        active ? "bg-indigo-600/10 text-indigo-400 ring-1 ring-inset ring-indigo-500/20" : "text-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-300"
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("transition-transform group-active:scale-95", active && "text-indigo-400")}>{icon}</span>
        <span className="text-sm font-semibold tracking-tight">{label}</span>
      </div>
      {count !== undefined && (
        <span className={cn(
          "text-[10px] font-bold px-2 py-1 rounded-lg",
          active ? "bg-indigo-500 text-white" : "bg-neutral-800 text-neutral-500"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}
