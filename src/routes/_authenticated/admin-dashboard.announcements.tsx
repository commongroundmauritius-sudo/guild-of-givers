import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/lib/community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pin, Trash2, Edit, Megaphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { updateAnnouncement, deleteAnnouncement } from "@/lib/security/auth-actions";

export const Route = createFileRoute("/_authenticated/admin-dashboard/announcements")({
  component: AdminAnnouncementsPage,
});

function AdminAnnouncementsPage() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    enabled: !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteAnnouncement({ data: { id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast.success("Announcement deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const pinMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await updateAnnouncement({ data: { id, data } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    
      <section className="bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Administration
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary">
                Announcement Management
              </h1>
              <p className="mt-2 text-muted-foreground">
                Create and manage official platform communications.
              </p>
            </div>
            <Button onClick={() => setIsCreating(true)} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </div>

          <div className="mt-12 space-y-6">
            {isCreating && (
              <AnnouncementForm
                onCancel={() => setIsCreating(false)}
                onSuccess={() => setIsCreating(false)}
              />
            )}

            <div className="grid gap-6">
              {isLoading ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => <Card key={i} className="h-32 w-full animate-pulse bg-muted" />)
              ) : announcements.length > 0 ? (
                announcements.map((a) =>
                  editingId === a.id ? (
                    <AnnouncementForm
                      key={a.id}
                      initialData={a}
                      onCancel={() => setEditingId(null)}
                      onSuccess={() => setEditingId(null)}
                    />
                  ) : (
                    <Card key={a.id} className={a.pinned ? "border-amber-500" : ""}>
                      <CardContent className="p-6 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase bg-muted px-2 py-0.5 rounded">
                              {a.category}
                            </span>
                            {a.pinned && <Pin className="h-3 w-3 text-amber-500 fill-amber-500" />}
                          </div>
                          <h3 className="text-lg font-bold">{a.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{a.content}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              pinMutation.mutate({
                                id: a.id,
                                data: {
                                  title: a.title,
                                  content: a.content,
                                  category: a.category,
                                  pinned: !a.pinned,
                                },
                              })
                            }
                            title={a.pinned ? "Unpin" : "Pin to top"}
                          >
                            <Pin
                              className={
                                a.pinned ? "h-4 w-4 text-amber-500 fill-amber-500" : "h-4 w-4"
                              }
                            />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingId(a.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => deleteMutation.mutate(a.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ),
                )
              ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-3xl">
                  <p className="text-muted-foreground">
                    No announcements found. Create your first one!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    
  );
}

function AnnouncementForm({
  initialData,
  onCancel,
  onSuccess,
}: {
  initialData?: Announcement;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    content: initialData?.content || "",
    category: initialData?.category || "Platform News",
    pinned: initialData?.pinned || false,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      await updateAnnouncement({
        data: {
          id: initialData?.id,
          data,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success(initialData ? "Updated" : "Created");
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <Card className="border-2 border-amber-500 shadow-xl">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Announcement" : "New Announcement"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        <select
          className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        >
          <option>Platform News</option>
          <option>Initiative Update</option>
          <option>Event</option>
          <option>Volunteer Call</option>
          <option>Success Story</option>
          <option>Emergency Alert</option>
        </select>
        <Textarea
          placeholder="Content"
          className="min-h-[150px]"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="pinned"
            checked={formData.pinned}
            onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
          />
          <label htmlFor="pinned" className="text-sm font-medium">
            Pin this announcement
          </label>
        </div>
      </CardContent>
      <div className="flex justify-end gap-2 p-6 border-t bg-muted/20">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => mutation.mutate(formData)} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Announcement"}
        </Button>
      </div>
    </Card>
  );
}
