import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Settings,
  Heart,
  FileText,
  Shield,
  Users,
  MessageCircle,
  Megaphone,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "./Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const GUEST_NAV = [
  { label: "About", to: "/about" },
  { label: "Initiatives", to: "/initiatives" },
  { label: "For Orgs", to: "/for-orgs" },
  { label: "Partner", to: "/partner" },
  { label: "FAQ", to: "/faq" },
] as const;

const ADMIN_NAV = [
  { label: "Dashboard", to: "/admin-dashboard", icon: LayoutDashboard },
  { label: "Community Hub", to: "/community-hub", icon: MessageCircle },
  { label: "Announcements", to: "/admin-dashboard/announcements", icon: Megaphone },
  { label: "Moderation", to: "/admin-dashboard/community-posts", icon: MessageCircle },
  { label: "Initiatives", to: "/admin-dashboard/initiatives", icon: Heart },
  { label: "Organizations", to: "/admin-dashboard/organizations", icon: Shield },
  { label: "Members", to: "/admin-dashboard/members", icon: User },
  { label: "Leads", to: "/admin-dashboard/leads", icon: Users },
] as const;

const MEMBER_NAV = [
  { label: "Dashboard", to: "/member", icon: LayoutDashboard },
  { label: "Community Hub", to: "/community-hub", icon: MessageCircle },
  { label: "Contributions", to: "/member", icon: Heart },
  { label: "Supported", to: "/member", icon: FileText },
] as const;

const Organization_NAV = [
  { label: "Dashboard", to: "/organization", icon: LayoutDashboard },
  { label: "Community Hub", to: "/community-hub", icon: MessageCircle },
  { label: "Initiatives", to: "/organization", icon: Heart },
  { label: "Reports", to: "/organization", icon: FileText },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, role, profile, isSubscribed, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems =
    role === "admin"
      ? ADMIN_NAV
      : role === "organization"
        ? Organization_NAV
        : role === "member"
          ? MEMBER_NAV
          : GUEST_NAV;
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.to + item.label}
                to={item.to}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                activeOptions={item.to === "/admin-dashboard" ? { exact: true } : {}}
                activeProps={{ className: "text-primary font-bold" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          {!user ? (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
              >
                Become a Member
              </Link>
            </>
          ) : (
            <>
              {!isSubscribed && role === "member" && (
                <Link
                  to="/signup"
                  className="mr-2 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
                >
                  Complete Membership
                </Link>
              )}

              <div className="flex items-center gap-3 pr-2">
                <span className="text-sm font-medium text-foreground/70">{displayName}</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative flex h-10 items-center gap-2 rounded-full px-1 py-1 hover:bg-muted"
                  >
                    <Avatar className="h-8 w-8 border border-border/60">
                      <AvatarImage src={profile?.avatar_url || ""} alt={displayName} />
                      <AvatarFallback
                        className={
                          role === "admin"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-teal-100 text-teal-700"
                        }
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      {role && (
                        <span
                          className={`mt-1 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            role === "admin"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-teal-100 text-teal-700"
                          }`}
                        >
                          {role}
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      to={
                        role === "admin"
                          ? "/admin-dashboard"
                          : role === "organization"
                            ? "/organization"
                            : "/member"
                      }
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={role === "admin" ? "/admin-dashboard/profile" : "/member/profile"}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={role === "admin" ? "/admin-dashboard/settings" : "/member/settings"}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut().then(() => navigate({ to: "/login" }))}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
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
            {navItems.map((item) => (
              <Link
                key={item.to + item.label}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-foreground/80 hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}

            {user && (
              <>
                <div className="my-2 h-px bg-border/60" />
                <Link
                  to={role === "admin" ? "/admin-dashboard/profile" : "/member/profile"}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-foreground/80 hover:bg-muted"
                >
                  <User className="h-5 w-5" />
                  Profile
                </Link>
                <Link
                  to={role === "admin" ? "/admin-dashboard/settings" : "/member/settings"}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-foreground/80 hover:bg-muted"
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </Link>
              </>
            )}

            <div className="px-4 pt-4">
              {user ? (
                <button
                  onClick={() => {
                    signOut().then(() => navigate({ to: "/login" }));
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-bold text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              ) : (
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground"
                >
                  Become a Member
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
