import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Search,
  Filter,
  Settings,
  Eye,
  Heart,
  Globe,
  Loader2,
  Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { deleteInitiative } from "@/lib/security/auth-actions";

export const Route = createFileRoute("/_authenticated/admin-dashboard/initiatives/")({
  component: AdminInitiativesPage,
});

function AdminInitiativesPage() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: initiatives = [], isLoading } = useQuery({
    queryKey: ["admin-initiatives"],
    enabled: !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("*, organizations(organization_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteInitiative({ data: { id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-initiatives"] });
      toast.success("Initiative deleted successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = initiatives.filter(i =>
    i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.organizations?.organization_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SiteLayout>
      <section className="bg-muted/30 py-12 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Administration</span>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary">Programs & Initiatives</h1>
              <p className="mt-2 text-muted-foreground">Oversee and manage the active impact catalog.</p>
            </div>
            <Button asChild className="rounded-xl gap-2 shadow-lg shadow-primary/20 h-12 px-6">
              <Link to="/admin-dashboard/initiatives/new">
                <Plus className="h-5 w-5" /> Onboard Initiative
              </Link>
            </Button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or organization..."
                className="pl-9 rounded-xl h-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="rounded-xl h-11 px-6 gap-2">
              <Filter className="h-4 w-4" /> Filter Catalog
            </Button>
          </div>

          <Card className="rounded-[2rem] border-border/40 overflow-hidden shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="pl-8">Initiative</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Metrics</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-8 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/50" />
                        <p className="mt-2 text-sm text-muted-foreground">Loading catalog...</p>
                      </TableCell>
                    </TableRow>
                  ) : filtered.length > 0 ? (
                    filtered.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="pl-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl overflow-hidden border border-border/40 shrink-0">
                              <img src={item.image_url || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1200'} className="h-full w-full object-cover" alt="" />
                            </div>
                            <div>
                              <div className="font-bold text-primary leading-tight">{item.title}</div>
                              <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1 tracking-wider">{item.category}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{item.organizations?.organization_name || 'CommonGround'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <div className="flex items-center gap-1 text-xs">
                              <Eye className="h-3.5 w-3.5" /> {item.view_count || 0}
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Heart className="h-3.5 w-3.5" /> {item.conversion_count || 0}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className="rounded-lg capitalize">
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="ghost" size="icon" className="rounded-xl h-9 w-9">
                              <Link to={`/admin-dashboard/initiatives/${item.id}/manage` as any}>
                                <Settings className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-red-500 hover:bg-red-50" onClick={() => deleteMutation.mutate(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                        No initiatives found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>
    </SiteLayout>
  );
}
