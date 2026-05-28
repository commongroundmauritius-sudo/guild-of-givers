import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { segmentationService, SegmentFilter } from "@/lib/crm/segmentation-service";
import { useQuery } from "@tanstack/react-query";
import { Users, Filter, Plus, Save } from "lucide-react";

interface SegmentationViewProps {
  organizationId: string;
}

export const SegmentationView: React.FC<SegmentationViewProps> = ({ organizationId }) => {
  const [activeSegment, setActiveSegment] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: segments, refetch: refetchSegments } = useQuery({
    queryKey: ["segments", organizationId],
    queryFn: () => segmentationService.getSegments(organizationId)
  });

  const { data: members, isFetching: isFetchingMembers } = useQuery({
    queryKey: ["segment-members", organizationId, activeSegment?.id],
    queryFn: () => activeSegment ? segmentationService.getSegmentMembers(organizationId, activeSegment.filter_definition) : [],
    enabled: !!activeSegment
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Supporter Segments</h2>
          <p className="text-muted-foreground">Dynamic behavioral segmentation for your mission.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Segment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" /> My Segments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {segments?.map((segment: any) => (
              <button
                key={segment.id}
                onClick={() => setActiveSegment(segment)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  activeSegment?.id === segment.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <div className="font-medium text-sm">{segment.name}</div>
                {segment.description && <div className="text-xs opacity-80 truncate">{segment.description}</div>}
              </button>
            ))}
            {(!segments || segments.length === 0) && (
              <p className="text-sm text-center py-4 text-muted-foreground">No segments yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                {activeSegment ? (
                  <>
                    <Users className="h-5 w-5" />
                    {activeSegment.name}
                  </>
                ) : "Select a segment"}
              </CardTitle>
              {activeSegment && (
                <div className="flex gap-2">
                  <Badge variant="outline">{(members as any[])?.length || 0} Members</Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {activeSegment ? (
              <div className="divide-y">
                {isFetchingMembers ? (
                  <div className="p-8 text-center text-muted-foreground italic">Calculating segment members...</div>
                ) : (members as any[])?.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground italic">No supporters match these criteria.</div>
                ) : (
                  (members as any[])?.map((member: any) => (
                    <div key={member.id} className="p-4 flex justify-between items-center hover:bg-muted/50">
                      <div>
                        <div className="font-medium">{member.full_name || "Anonymous Supporter"}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                      <Badge variant="secondary">{member.lifecycle_stage}</Badge>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Select a segment from the sidebar or create a new one to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
