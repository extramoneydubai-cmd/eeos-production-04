/**
 * EEOS Workspace Documents Tab
 *
 * Displays documents and attachments for an entity using the AttachmentPanel.
 * Integrates with documentSdk for document CRUD.
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttachmentPanel } from "@/components/shared/AttachmentPanel";
import { EmptyState } from "@/components/shared/EmptyState";
import { FileText } from "lucide-react";
import type { WorkspaceTabProps } from "./types";

/**
 * WorkspaceDocumentsTab — entity-bound document management.
 */
export function WorkspaceDocumentsTab({
  entityType,
  entityId,
  entity,
}: WorkspaceTabProps) {
  const attachments = useQuery(
    api.engines.attachmentEngine.listByEntity,
    entityId ? { entityType, entityId } : "skip",
  );

  const generateUploadUrl = useMutation(api.engines.attachmentEngine.generateUploadUrl);
  const uploadAttachment = useMutation(api.engines.attachmentEngine.upload);
  const deleteAttachment = useMutation(api.engines.attachmentEngine.remove);
  const restoreAttachment = useMutation(api.engines.attachmentEngine.restore);

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed");
      const json: any = await res.json();
      const storageId = json.storageId as string;
      const ext = file.name.split(".").pop() || "";
      await uploadAttachment({
        fileName: file.name,
        originalName: file.name,
        size: file.size,
        extension: ext,
        mimeType: file.type,
        storageId,
        storageProvider: "local",
        category: "general",
        entityType,
        entityId,
      });
    }
  };

  const handleDelete = async (attachmentId: string) => {
    await deleteAttachment({ attachmentId });
  };

  const handleRestore = async (attachmentId: string) => {
    await restoreAttachment({ attachmentId });
  };

  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AttachmentPanel
          entityType={entityType}
          entityId={entityId}
          attachments={(attachments as any[]) || []}
          onUpload={handleUpload}
          onDelete={handleDelete}
          onRestore={handleRestore}
          canEdit={true}
        />
      </CardContent>
    </Card>
  );
}
