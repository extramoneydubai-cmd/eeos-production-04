/**
 * EEOS Workspace Notes Tab
 *
 * Notes and comments for an entity using the CommentPanel component.
 * Integrates with communicationSdk for comment CRUD.
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommentPanel } from "@/components/shared/CommentPanel";
import { MessageSquare } from "lucide-react";
import type { WorkspaceTabProps } from "./types";

/**
 * WorkspaceNotesTab — entity-bound notes and comments via CommentPanel.
 */
export function WorkspaceNotesTab({
  entityType,
  entityId,
  entity,
}: WorkspaceTabProps) {
  const comments = useQuery(
    api.engines.commentEngine.listByEntity,
    entityId ? { entityType, entityId } : "skip",
  );

  const addComment = useMutation(api.engines.commentEngine.create);
  const replyComment = useMutation(api.engines.commentEngine.reply);
  const deleteComment = useMutation(api.engines.commentEngine.remove);
  const resolveComment = useMutation(api.engines.commentEngine.resolve);
  const pinComment = useMutation(api.engines.commentEngine.pin);
  const reactToComment = useMutation(api.engines.commentEngine.toggleReaction);

  const handleSubmit = async (body: string, parentId?: string) => {
    if (parentId) {
      await replyComment({ body, parentId: parentId as any });
    } else {
      await addComment({ body, entityType, entityId });
    }
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment({ commentId: commentId as any });
  };

  const handleResolve = async (commentId: string, resolved: boolean) => {
    await resolveComment({ commentId: commentId as any, resolved });
  };

  const handlePin = async (commentId: string, pinned: boolean) => {
    await pinComment({ commentId: commentId as any, pinned });
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    await reactToComment({ commentId: commentId as any, emoji });
  };

  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          Notes &amp; Comments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CommentPanel
          entityType={entityType}
          entityId={entityId}
          comments={(comments as any[]) || []}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          onResolve={handleResolve}
          onPin={handlePin}
          onReaction={handleReaction}
          canEdit={true}
        />
      </CardContent>
    </Card>
  );
}
