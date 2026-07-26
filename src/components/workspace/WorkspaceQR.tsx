/**
 * EEOS Workspace QR Component
 *
 * Displays a QR code for an entity (e.g. student, person, lead).
 * When clicked, opens a dialog with a larger QR code.
 * Future: generates QR via QR server or peopleSdk.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

interface WorkspaceQRProps {
  /** Entity type (used for QR data encoding) */
  entityType: string;
  /** Entity ID */
  entityId: string;
  /** Display name shown in the dialog */
  entityName?: string;
  /** Icon class override */
  className?: string;
}

/**
 * WorkspaceQR — QR code button + dialog for any entity.
 */
export function WorkspaceQR({
  entityType,
  entityId,
  entityName,
  className,
}: WorkspaceQRProps) {
  const [open, setOpen] = useState(false);

  // QR data payload — structured for future QR server integration
  const qrData = JSON.stringify({
    v: "1",
    type: entityType,
    id: entityId,
    ts: Date.now(),
  });

  // Placeholder QR URL — replace with QR generation service
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn("h-8 text-xs gap-1.5", className)}
        onClick={() => setOpen(true)}
      >
        <QrCode className="h-3.5 w-3.5" />
        QR
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[280px]">
          <DialogHeader>
            <DialogTitle className="text-sm">QR Code</DialogTitle>
            <DialogDescription className="text-xs">
              {entityName || `${entityType}: ${entityId.slice(-8)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            {/* Placeholder QR — replace with actual QR component */}
            <div className="w-[200px] h-[200px] bg-accent/30 rounded-sm flex items-center justify-center border border-border/50">
              <div className="text-center">
                <QrCode className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground/50">
                  QR placeholder
                </p>
                <p className="text-[8px] text-muted-foreground/30 mt-1 font-mono">
                  {entityId.slice(-8)}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/50 text-center">
              Scan to view {entityType} profile
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { cn } from "@/lib/utils";
