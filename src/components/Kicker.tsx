import { ReactNode } from "react";

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
      {children}
    </span>
  );
}
