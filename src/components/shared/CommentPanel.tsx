import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare, Reply, Pin, CheckCircle2, Trash2,
  ChevronDown, ChevronRight, Send, AlertCircle,
  ThumbsUp, Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Comment field shape used by the UI */
interface CommentField {
  _id: string;
  _creationTime: number;
  body: string;
  bodyHtml?: string;
  entityType: string;
  entityId: string;
  parentId?: string;
  rootId?: string;
  userId: string;
  mentions?: string[];
  reactions?: { emoji: string; userId: string }[];
  attachmentIds?: string[];
  isEdited: boolean;
  isResolved: boolean;
  isPinned: boolean;
  visibility: string;
  createdAt: number;
  /** Enriched */
  replyCount?: number;
  userName?: string;
  userImage?: string | null;
}

interface CommentPanelProps {
  entityType: string;
  entityId: string;
  comments?: CommentField[];
  isLoading?: boolean;
  /** Called to submit a new comment */
  onSubmit?: (body: string, parentId?: string) => void;
  /** Called to delete a comment */
  onDelete?: (commentId: string) => void;
  /** Called to resolve/unresolve a comment */
  onResolve?: (commentId: string, resolved: boolean) => void;
  /** Called to pin/unpin a comment */
  onPin?: (commentId: string, pinned: boolean) => void;
  /** Called to toggle a reaction */
  onReaction?: (commentId: string, emoji: string) => void;
  /** If true, the user can interact */
  canEdit?: boolean;
  /** Title for the panel */
  title?: string;
}

const visibilityLabels: Record<string, string> = {
  public: "Public",
  internal: "Internal",
  private: "Private",
};

const visibilityColors: Record<string, string> = {
  public: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  internal: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  private: "bg-red-500/10 text-red-600 dark:text-red-400",
};

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CommentThread({
  comment,
  replies,
  onReply,
  onDelete,
  onResolve,
  onPin,
  onReaction,
  canEdit,
  depth = 0,
}: {
  comment: CommentField;
  replies?: CommentField[];
  onReply: (parentId: string) => void;
  onDelete: (id: string) => void;
  onResolve: (id: string, resolved: boolean) => void;
  onPin: (id: string, pinned: boolean) => void;
  onReaction: (id: string, emoji: string) => void;
  canEdit?: boolean;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isDeleted = comment.body === "[deleted]";
  const initials = comment.userName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className={cn("group", depth > 0 && "ml-6 pl-3 border-l border-border/30")}>
      <div className={cn("flex gap-2.5 py-2.5 transition-colors rounded-sm px-2 -mx-2", !isDeleted && "hover:bg-accent/20")}>
        {!isDeleted && (
          <Avatar className="h-6 w-6 mt-0.5 shrink-0">
            <AvatarFallback className="text-[9px] bg-accent text-accent-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0 flex-1">
          {isDeleted ? (
            <p className="text-xs text-muted-foreground/40 italic">[deleted]</p>
          ) : (
            <>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-medium">{comment.userName || "Unknown"}</span>
                <span className="text-[10px] text-muted-foreground/50">{formatTime(comment.createdAt)}</span>
                {comment.isEdited && (
                  <span className="text-[9px] text-muted-foreground/40">(edited)</span>
                )}
                {comment.isPinned && (
                  <Pin className="h-2.5 w-2.5 text-amber-500" />
                )}
                {comment.isResolved && (
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[8px] px-1 py-0 h-3.5 font-normal uppercase tracking-wider",
                    visibilityColors[comment.visibility] || visibilityColors.public,
                  )}
                >
                  {visibilityLabels[comment.visibility] || comment.visibility}
                </Badge>
              </div>
              <p className="text-xs mt-0.5 leading-relaxed whitespace-pre-wrap">{comment.body}</p>

              {/* Reactions */}
              {comment.reactions && comment.reactions.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {Object.entries(
                    comment.reactions.reduce<Record<string, string[]>>((acc, r) => {
                      if (!acc[r.emoji]) acc[r.emoji] = [];
                      acc[r.emoji].push(r.userId);
                      return acc;
                    }, {}),
                  ).map(([emoji, users]) => (
                    <button
                      key={emoji}
                      onClick={() => onReaction(comment._id, emoji)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-sm bg-accent/30 hover:bg-accent/50 transition-colors"
                    >
                      {emoji}
                      <span className="text-muted-foreground/60">{users.length}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onReply(comment._id)}
                  className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  <Reply className="h-2.5 w-2.5" />
                  Reply
                </button>
                <button
                  onClick={() => onReaction(comment._id, "👍")}
                  className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  <ThumbsUp className="h-2.5 w-2.5" />
                  Like
                </button>
                {canEdit && (
                  <>
                    <button
                      onClick={() => onResolve(comment._id, !comment.isResolved)}
                      className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50 hover:text-emerald-500 transition-colors"
                    >
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      {comment.isResolved ? "Unresolve" : "Resolve"}
                    </button>
                    <button
                      onClick={() => onDelete(comment._id)}
                      className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {/* Reply count */}
          {comment.replyCount != null && comment.replyCount > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
              {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>
      </div>

      {/* Replies (shown when expanded) */}
      {expanded && replies && replies.length > 0 && (
        <div className="mt-0.5">
          {replies.map((reply) => (
            <CommentThread
              key={reply._id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              onResolve={onResolve}
              onPin={onPin}
              onReaction={onReaction}
              canEdit={canEdit}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentPanel({
  entityType,
  entityId,
  comments,
  isLoading,
  onSubmit,
  onDelete,
  onResolve,
  onPin,
  onReaction,
  canEdit = false,
  title = "Comments",
}: CommentPanelProps) {
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const pinned = (comments ?? []).filter((c) => c.isPinned && !c.parentId);
  const topLevel = (comments ?? []).filter((c) => !c.isPinned && !c.parentId);

  const handleSubmit = useCallback(() => {
    if (!newComment.trim() || !onSubmit) return;
    onSubmit(newComment.trim());
    setNewComment("");
  }, [newComment, onSubmit]);

  const handleReplySubmit = useCallback(() => {
    if (!replyText.trim() || !onSubmit || !replyTo) return;
    onSubmit(replyText.trim(), replyTo);
    setReplyText("");
    setReplyTo(null);
  }, [replyText, onSubmit, replyTo]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, submitFn: () => void) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submitFn();
      }
    },
    [],
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-xs font-medium">{title}</h3>
          {comments && (
            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 font-normal text-muted-foreground/50">
              {comments.length}
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* New Comment Input */}
      {canEdit && (
        <div className="flex gap-2 items-start">
          <div className="flex-1 min-w-0">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
              placeholder="Add a comment... (mention @user)"
              rows={2}
              className="w-full text-xs rounded-sm border border-border/50 bg-transparent px-3 py-2 focus:outline-none focus:border-border resize-none placeholder:text-muted-foreground/30 text-muted-foreground"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 h-8 text-xs shrink-0"
            disabled={!newComment.trim()}
            onClick={handleSubmit}
          >
            <Send className="h-3 w-3" />
            Send
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && pinned.length === 0 && topLevel.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquare className="h-6 w-6 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">No comments yet</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            {canEdit ? "Start the conversation by adding a comment above." : "No discussions for this entity."}
          </p>
        </div>
      )}

      {/* Pinned Comments */}
      {pinned.length > 0 && (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 mb-1">
            <Pin className="h-2.5 w-2.5 text-amber-500/70" />
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">Pinned</span>
          </div>
          <div className="bg-amber-500/5 rounded-sm -mx-1 px-1">
            {pinned.map((comment) => (
              <CommentThread
                key={comment._id}
                comment={comment}
                onReply={(id) => { setReplyTo(id); }}
                onDelete={onDelete || (() => {})}
                onResolve={onResolve || (() => {})}
                onPin={onPin || (() => {})}
                onReaction={onReaction || (() => {})}
                canEdit={canEdit}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top-level Comments */}
      {topLevel.length > 0 && (
        <div className="space-y-0.5">
          {topLevel.map((comment) => (
            <CommentThread
              key={comment._id}
              comment={comment}
              onReply={(id) => { setReplyTo(id); }}
              onDelete={onDelete || (() => {})}
              onResolve={onResolve || (() => {})}
              onPin={onPin || (() => {})}
              onReaction={onReaction || (() => {})}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}

      {/* Reply Input (inline reply) */}
      {replyTo && canEdit && (
        <div className="flex gap-2 items-start ml-6 pl-3 border-l border-border/30 mt-2">
          <div className="flex-1 min-w-0">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleReplySubmit)}
              placeholder="Write a reply..."
              rows={2}
              className="w-full text-xs rounded-sm border border-border/50 bg-transparent px-3 py-2 focus:outline-none focus:border-border resize-none placeholder:text-muted-foreground/30 text-muted-foreground"
            />
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setReplyTo(null); setReplyText(""); }}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 h-8 text-xs"
              disabled={!replyText.trim()}
              onClick={handleReplySubmit}
            >
              <Send className="h-3 w-3" />
              Reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
