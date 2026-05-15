import { cn } from "@/lib/utils";
import logoSrc from "@/assets/logo.png";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img src={logoSrc} alt="CommonGround logo" className="h-9 w-9 object-contain" />
      {!iconOnly && (
        <span className="font-display text-xl font-bold tracking-tight text-primary">
          CommonGround
        </span>
      )}
    </div>
  );
}
