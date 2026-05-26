import { Link } from "@tanstack/react-router";
import { ArrowRight, Heart } from "lucide-react";
import { getJoinedField } from "@/lib/utils";

interface InitiativeCardProps {
  initiative: any;
}

export function InitiativeCard({ initiative }: InitiativeCardProps) {
  const goal = Math.max(1, Number(initiative.goal_amount_mur) || 0);
  const current = Number(initiative.current_amount_mur) || 0;
  const progress = Math.min(100, Math.round((current / goal) * 100));

  const organizationName = getJoinedField(initiative.organizations, "organization_name");

  return (
    <Link
      to="/initiatives/$slug"
      params={{ slug: initiative.slug || initiative.id }}
      className="group flex flex-col overflow-hidden rounded-[2.5rem] border border-border/40 bg-card transition-all duration-300 hover:-translate-y-2 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {initiative.image_url ? (
          <img
            src={initiative.image_url}
            alt={initiative.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
            <Heart className="h-12 w-12 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <div className="flex flex-1 flex-col p-8">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
            {organizationName || "Organization Partner"}
          </span>
        </div>

        <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-primary transition-colors group-hover:text-primary/80">
          {initiative.title}
        </h2>

        {initiative.caption && (
          <p className="mt-2 text-sm font-semibold text-teal-600 line-clamp-1">{initiative.caption}</p>
        )}

        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {initiative.summary ||
            initiative.description ||
            "Join us in supporting this vital initiative for the community."}
        </p>

        <div className="mt-auto pt-8">
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Funding Progress</span>
              <span className="text-primary">{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-primary">
                Rs {current.toLocaleString()}
              </span>
              <span className="text-[10px] font-medium uppercase text-muted-foreground">
                raised of Rs {goal.toLocaleString()}
              </span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/20">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
