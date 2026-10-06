import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Search, Mail, Calendar, MapPin, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/admin-dashboard/members")({
  component: AdminMembersPage,
});

function AdminMembersPage() {
  const { user, role } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const { data: members, isLoading, isError, error } = useQuery({
    queryKey: ["admin-members"],
    enabled: !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      // First get member user IDs from user_roles
      const { data: memberRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "member");

      const memberIds = memberRoles?.map((r) => r.user_id) || [];

      if (memberIds.length === 0) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", memberIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredMembers = members?.filter(
    (member) =>
      (member.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (member.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
  );

  return (
    
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Administration
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary">
                Member Management
              </h1>
              <p className="mt-2 text-muted-foreground">
                Overview of platform members and their activity.
              </p>
            </div>
            <div className="relative w-full max-w-sm sm:w-64">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full border border-border/40 bg-card py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-border/40 bg-card shadow-sm">
            {isError ? (\n              <div className="flex flex-col items-center justify-center p-20 text-center">\n                <div className="rounded-full bg-destructive/10 p-4">\n                  <Info className="h-8 w-8 text-destructive" />\n                </div>\n                <h2 className="mt-6 font-display text-2xl font-semibold text-primary">\n                  Unable to load members\n                </h2>\n                <p className="mt-2 text-muted-foreground">\n                  {error instanceof Error ? error.message : "Please try again."}\n                </p>\n              </div>\n            ) : isLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : filteredMembers && filteredMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-8 py-5 font-medium uppercase tracking-wider text-[10px]">
                        Member
                      </th>
                      <th className="px-8 py-5 font-medium uppercase tracking-wider text-[10px]">
                        Contact
                      </th>
                      <th className="px-8 py-5 font-medium uppercase tracking-wider text-[10px]">
                        Location
                      </th>
                      <th className="px-8 py-5 font-medium uppercase tracking-wider text-[10px]">
                        Joined
                      </th>
                      <th className="px-8 py-5 font-medium uppercase tracking-wider text-[10px]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="transition hover:bg-muted/30 cursor-pointer"
                        onClick={() => navigate({ to: `/admin-dashboard/members/${member.id}` })}
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border border-border/60">
                              <AvatarImage src={member.avatar_url || ""} alt={`${member.full_name || "Member"} profile photo`} />
                              <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-bold uppercase">
                                {(member.full_name || member.email || "??").substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-primary">
                                {member.full_name || "Unnamed Member"}
                              </p>
                              <p className="text-[11px] text-muted-foreground uppercase font-mono">
                                {member.id.substring(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{member.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{member.country || "Mauritius"}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {member.created_at
                                ? new Date(member.created_at).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              member.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {member.status || "active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 text-center">
                <div className="rounded-full bg-muted p-4">
                  <Info className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="mt-6 font-display text-2xl font-semibold text-primary">
                  No members found
                </h2>
                <p className="mt-2 text-muted-foreground">
                  No platform members match your current criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    
  );
}
