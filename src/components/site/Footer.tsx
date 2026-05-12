import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-cream-deep/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground font-display">
              ∞
            </span>
            <span className="font-display text-lg font-semibold text-primary">CommonGround</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            One membership. Long-term impact. Predictable, transparent funding for the social work
            that takes years, not weeks.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-primary">Platform</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/about" className="text-foreground/80 hover:text-primary">
                About
              </Link>
            </li>
            <li>
              <Link to="/initiatives" className="text-foreground/80 hover:text-primary">
                Initiatives
              </Link>
            </li>
            <li>
              <Link to="/for-orgs" className="text-foreground/80 hover:text-primary">
                For Orgs
              </Link>
            </li>
            <li>
              <Link to="/partner" className="text-foreground/80 hover:text-primary">
                Partner With Us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-primary">Resources</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/faq" className="text-foreground/80 hover:text-primary">
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/legal" className="text-foreground/80 hover:text-primary">
                Legal
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-foreground/80 hover:text-primary">
                Log in
              </Link>
            </li>
            <li>
              <Link to="/signup" className="text-foreground/80 hover:text-primary">
                Become a member
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} CommonGround. All rights reserved.</span>
          <span>Built for long-term impact.</span>
        </div>
      </div>
    </footer>
  );
}
