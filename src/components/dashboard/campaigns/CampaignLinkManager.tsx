import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { campaignService, CampaignLink } from "@/lib/campaign-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Plus, QrCode, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { createCampaignLink } from "@/lib/security/auth-actions";

interface CampaignLinkManagerProps {
  initiativeId: string;
}

export function CampaignLinkManager({ initiativeId }: CampaignLinkManagerProps) {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLink, setNewLink] = useState({
    name: "",
    source_type: "social",
    tracking_code: "",
    expires_at: "",
  });

  const { data: links, isLoading } = useQuery({
    queryKey: ["campaign-links", initiativeId],
    queryFn: () => campaignService.getInitiativeLinks(initiativeId),
  });

  const createMutation = useMutation({
    mutationFn: (params: any) => createCampaignLink({ data: params }),
    onSuccess: () => {
      toast.success("Campaign link created successfully");
      queryClient.invalidateQueries({ queryKey: ["campaign-links", initiativeId] });
      setIsCreateOpen(false);
      setNewLink({ name: "", source_type: "social", tracking_code: "", expires_at: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CampaignLink> }) =>
      campaignService.updateLink(id, updates),
    onSuccess: () => {
      toast.success("Campaign link updated");
      queryClient.invalidateQueries({ queryKey: ["campaign-links", initiativeId] });
    },
  });

  const generateTrackingCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setNewLink((prev) => ({ ...prev, tracking_code: code }));
  };

  const copyToClipboard = (code: string) => {
    const url = `${window.location.origin}/initiatives/${initiativeId}?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      initiative_id: initiativeId,
      name: newLink.name,
      source_type: newLink.source_type,
      tracking_code: newLink.tracking_code,
      expires_at: newLink.expires_at || undefined,
      is_active: true,
    });
  };

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  return (
    <Card className="rounded-3xl border-border/40">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-xl font-semibold">Campaign Links</CardTitle>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2">
              <Plus className="h-4 w-4" /> New Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle>Create Campaign Link</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Link Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Facebook Summer Ad"
                  value={newLink.name}
                  onChange={(e) => setNewLink((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select
                    value={newLink.source_type}
                    onValueChange={(v) => setNewLink((prev) => ({ ...prev, source_type: v }))}
                  >
                    <SelectTrigger id="source">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="qr">QR Code</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Tracking Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={newLink.tracking_code}
                      onChange={(e) =>
                        setNewLink((prev) => ({ ...prev, tracking_code: e.target.value }))
                      }
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={generateTrackingCode}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiration Date (Optional)</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={newLink.expires_at}
                  onChange={(e) => setNewLink((prev) => ({ ...prev, expires_at: e.target.value }))}
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Generate Link"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links?.map((link) => (
              <TableRow key={link.id}>
                <TableCell className="font-medium">{link.name}</TableCell>
                <TableCell className="capitalize">{link.source_type}</TableCell>
                <TableCell>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                    {link.tracking_code}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge variant={link.is_active ? "default" : "secondary"}>
                    {link.is_active ? "Active" : "Disabled"}
                  </Badge>
                  {link.expires_at && new Date(link.expires_at) < new Date() && (
                    <Badge variant="destructive" className="ml-2">
                      Expired
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(link.tracking_code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-sm rounded-3xl">
                      <DialogHeader>
                        <DialogTitle className="text-center">{link.name} QR Code</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col items-center justify-center p-6 gap-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border">
                          <QRCodeCanvas
                            value={`${window.location.origin}/initiatives/${initiativeId}?ref=${link.tracking_code}`}
                            size={200}
                            level="H"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Scan to support initiative <br />
                          <span className="font-mono mt-1 block">Ref: {link.tracking_code}</span>
                        </p>
                        <Button
                          variant="outline"
                          className="w-full rounded-xl"
                          onClick={() => window.print()}
                        >
                          Print QR Code
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      updateMutation.mutate({
                        id: link.id,
                        updates: { is_active: !link.is_active },
                      })
                    }
                  >
                    {link.is_active ? (
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!links || links.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No campaign links created yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
