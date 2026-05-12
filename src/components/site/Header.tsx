import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "./Logo";

const NAV = [
  { label: "About", to: "/about" },
  { label: "Initiatives", to: "/initiatives" },
  { label: "For Orgs", to: "/for-orgs" },
  { label: "Partner", to: "/partner" },
  { label: "FAQ", to: "/faq" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              activeProps={{ className: "text-primary font-bold" }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to={user ? "/dashboard" : "/login"}
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            {user ? "Dashboard" : "Log in"}
          </Link>
        </nav>

        <div className="hidden lg:block">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
          >
            Become a Member
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background shadow-lg">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-6">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-foreground/80 hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={user ? "/dashboard" : "/login"}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-foreground/80 hover:bg-muted"
            >
              {user ? "Dashboard" : "Log in"}
            </Link>
            <div className="px-4 pt-4">
              <Link
                to="/signup"
                onClick={() => setOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground"
              >
                Become a Member
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
