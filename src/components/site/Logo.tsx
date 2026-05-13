import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <span className="font-display text-xl font-bold leading-none tracking-tighter">
          CG
        </span>
        <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent border-2 border-primary" />
      </div>
      {!iconOnly && (
        <span className="font-display text-xl font-bold tracking-tight text-primary">
          CommonGround
        </span>
      )}
    </div>
  );
}
