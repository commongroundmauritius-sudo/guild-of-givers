import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Loader, Users, Quote, User, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { sanitize } from "@/lib/security/sanitizeHtml";

export interface TeamMember {
  id: string;
  organization_id: string;
  name: string;
  title: string;
  quote: string;
  photo_url: string | null;
  display_order: number;
}

function getInitials(name: string): string {
  if (!name) return "TM";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface TeamMemberGridProps {
  members: TeamMember[];
  organizationId?: string;
  canEdit?: boolean;
  onMembersUpdated?: (members: TeamMember[]) => void;
  title?: string;
  subtitle?: string;
}

export function TeamMemberGrid({
  members,
  organizationId,
  canEdit = false,
  onMembersUpdated,
  title = "Meet the Team",
  subtitle = "Leadership and visionaries behind our mission",
}: TeamMemberGridProps) {
  const [isManageOpen, setIsManageOpen] = useState(false);

  // If no members and user cannot edit, don't display section
  if ((!members || members.length === 0) && !canEdit) {
    return null;
  }

  // Placeholder banner for admins/owners when 0 team members exist
  if ((!members || members.length === 0) && canEdit && organizationId) {
    return (
      <>
        <div className="bg-white rounded-[2.5rem] p-8 border border-dashed border-primary/30 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-primary">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Introduce leadership and key team members to supporters on your organization profile.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setIsManageOpen(true)}
            className="rounded-full bg-primary hover:bg-primary/90 text-sm font-bold gap-2 px-6"
          >
            <Plus className="w-4 h-4" /> Add Team Members
          </Button>
        </div>

        <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
          <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
                <Users className="w-5 h-5" /> Manage Team Members
              </DialogTitle>
            </DialogHeader>
            <TeamMemberEditor organizationId={organizationId} onMembersUpdated={onMembersUpdated} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="bg-white rounded-[2.5rem] p-8 border border-border/50 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-primary flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> {title}
            </h2>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>

          {canEdit && organizationId && (
            <Button
              type="button"
              onClick={() => setIsManageOpen(true)}
              variant="outline"
              size="sm"
              className="rounded-full border-primary/30 text-primary hover:bg-primary/5 font-bold text-xs gap-2 shrink-0 self-start sm:self-auto"
            >
              <Settings2 className="w-4 h-4" /> Manage Team
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col items-center text-center p-6 rounded-3xl bg-muted/20 border border-border/40 hover:border-primary/20 transition-all shadow-2xs"
            >
              {/* Avatar / Photo */}
              <Avatar className="w-20 h-20 mb-4 border-2 border-primary/20 shadow-sm">
                <AvatarImage
                  src={member.photo_url || ""}
                  alt={member.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg font-display">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>

              {/* Name */}
              <h3 className="font-bold text-primary text-base line-clamp-1">{member.name}</h3>

              {/* Title / Position */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5 line-clamp-1">
                {member.title}
              </p>

              {/* Quote in Italics */}
              <div className="mt-4 pt-3 border-t border-border/30 w-full relative">
                <Quote className="w-4 h-4 text-primary/30 mx-auto mb-1 rotate-180" />
                <p className="text-xs italic text-foreground/80 leading-relaxed line-clamp-4">
                  "{member.quote}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {canEdit && organizationId && (
        <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
          <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
                <Users className="w-5 h-5" /> Manage Team Members
              </DialogTitle>
            </DialogHeader>
            <TeamMemberEditor organizationId={organizationId} onMembersUpdated={onMembersUpdated} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

interface TeamMemberEditorProps {
  organizationId: string;
  onMembersUpdated?: (members: TeamMember[]) => void;
}

export function TeamMemberEditor({ organizationId, onMembersUpdated }: TeamMemberEditorProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<TeamMember> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      setLoadError(false);
      const { data, error } = await supabase
        .from("organization_team_members")
        .select("*")
        .eq("organization_id", organizationId)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      const loaded = (data as TeamMember[]) || [];
      setMembers(loaded);
      if (onMembersUpdated) onMembersUpdated(loaded);
    } catch (err: unknown) {
      console.error("Error loading team members:", err);
      setLoadError(true);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  }, [organizationId, onMembersUpdated]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleStartAdd = () => {
    setEditingMember({
      organization_id: organizationId,
      name: "",
      title: "",
      quote: "",
      photo_url: "",
      display_order: members.length,
    });
  };

  const handleStartEdit = (member: TeamMember) => {
    setEditingMember({ ...member });
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    const cleanName = sanitize(editingMember.name || "").trim();
    const cleanTitle = sanitize(editingMember.title || "").trim();
    const cleanQuote = sanitize(editingMember.quote || "").trim();
    const cleanPhotoUrl = editingMember.photo_url ? sanitize(editingMember.photo_url).trim() : null;

    if (!cleanName || !cleanTitle || !cleanQuote) {
      toast.error("Name, Title/Position, and Quote are required fields.");
      return;
    }

    if (cleanName.length > 120 || cleanTitle.length > 120 || cleanQuote.length > 1000) {
      toast.error("Please keep the name/title under 120 characters and the quote under 1,000 characters.");
      return;
    }

    if (cleanPhotoUrl) {
      try {
        const parsed = new URL(cleanPhotoUrl);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          throw new Error("invalid protocol");
        }
      } catch {
        toast.error("Please enter a valid HTTP(S) photo URL.");
        return;
      }
    }

    try {
      setIsSaving(true);
      if (editingMember.id) {
        // Update existing
        const { error } = await supabase
          .from("organization_team_members")
          .update({
            name: cleanName,
            title: cleanTitle,
            quote: cleanQuote,
            photo_url: cleanPhotoUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMember.id);

        if (error) throw error;
        toast.success("Team member updated.");
      } else {
        // Insert new
        const { error } = await supabase.from("organization_team_members").insert({
          organization_id: organizationId,
          name: cleanName,
          title: cleanTitle,
          quote: cleanQuote,
          photo_url: cleanPhotoUrl || null,
          display_order: members.length,
        });

        if (error) throw error;
        toast.success("Team member added.");
      }

      setEditingMember(null);
      await loadMembers();
    } catch (err: unknown) {
      console.error("Error saving team member:", err);
      const message = err instanceof Error ? err.message : "Failed to save team member.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;

    try {
      const { error } = await supabase.from("organization_team_members").delete().eq("id", id);

      if (error) throw error;
      toast.success("Team member removed.");
      await loadMembers();
    } catch (err: unknown) {
      console.error("Error deleting team member:", err);
      toast.error("Failed to delete team member.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <h3 className="text-base font-bold text-primary flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Manage Team Members
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add or update leadership and team members displayed on your organization's public
            profile.
          </p>
        </div>
        {!editingMember && (
          <Button
            type="button"
            onClick={handleStartAdd}
            size="sm"
            className="rounded-full bg-primary hover:bg-primary/90 text-xs font-bold gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Team Member
          </Button>
        )}
      </div>

      {/* Add / Edit Form Card */}
      {editingMember && (
        <form
          onSubmit={handleSaveMember}
          className="bg-muted/30 p-6 rounded-2xl border border-primary/20 space-y-4"
        >
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
            {editingMember.id ? "Edit Team Member" : "New Team Member"}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="memberName" className="text-xs font-bold text-primary">
                Full Name *
              </Label>
              <Input
                id="memberName"
                value={editingMember.name || ""}
                onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                placeholder="e.g. Jane Doe"
                className="rounded-xl bg-white text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="memberTitle" className="text-xs font-bold text-primary">
                Position / Title *
              </Label>
              <Input
                id="memberTitle"
                value={editingMember.title || ""}
                onChange={(e) => setEditingMember({ ...editingMember, title: e.target.value })}
                placeholder="e.g. Executive Director"
                className="rounded-xl bg-white text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="memberPhoto" className="text-xs font-bold text-primary">
              Photo URL (Optional)
            </Label>
            <Input
              id="memberPhoto"
              type="url"
              value={editingMember.photo_url || ""}
              onChange={(e) => setEditingMember({ ...editingMember, photo_url: e.target.value })}
              placeholder="https://example.com/photo.jpg"
              className="rounded-xl bg-white text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              Leave empty to show an automatic initials avatar.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="memberQuote" className="text-xs font-bold text-primary">
              Quote or Message *
            </Label>
            <Textarea
              id="memberQuote"
              value={editingMember.quote || ""}
              onChange={(e) => setEditingMember({ ...editingMember, quote: e.target.value })}
              placeholder="e.g. 'We are committed to empowering local communities through sustainable education.'"
              rows={3}
              className="rounded-xl bg-white text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="rounded-full text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-primary hover:bg-primary/90 text-xs font-bold gap-1.5"
            >
              {isSaving && <Loader className="w-3.5 h-3.5 animate-spin" />}
              {editingMember.id ? "Save Changes" : "Add Member"}
            </Button>
          </div>
        </form>
      )}

      {/* Members List */}
      {loading ? (
        <div className="flex items-center justify-center py-6" role="status" aria-live="polite">
          <Loader className="w-6 h-6 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Loading team members</span>
        </div>
      ) : loadError ? (
        <div className="text-center py-8 rounded-2xl border border-destructive/30 bg-destructive/5">
          <p className="text-sm font-medium text-destructive">Unable to load team members.</p>
          <Button type="button" variant="outline" size="sm" onClick={loadMembers} className="mt-3 rounded-full">
            Try again
          </Button>
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-8 bg-muted/10 rounded-2xl border border-dashed border-border/60">
          <User className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground font-medium">No team members added yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-border/60 shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-border">
                  <AvatarImage src={m.photo_url || ""} alt={m.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {getInitials(m.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-bold text-primary">{m.name}</h4>
                  <p className="text-xs text-muted-foreground">{m.title}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStartEdit(m)}
                  className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg"
                >
                  <Edit2 className="w-4 h-4" aria-hidden="true" />
                  <span className="sr-only">Edit {m.name}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteMember(m.id)}
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  <span className="sr-only">Delete {m.name}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
