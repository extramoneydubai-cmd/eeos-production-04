import * as React from "react"
import { DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

/**
 * ScrollableDialogContent — replaces `DialogContent` in forms that might overflow.
 * Automatically constrains height to 85vh and uses flex layout so the body
 * can scroll independently while the header and footer stay pinned.
 *
 * Usage:
 * ```tsx
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <ScrollableDialogContent className="sm:max-w-xl">
 *     <DialogHeader className="shrink-0">...</DialogHeader>
 *     <ScrollableDialogBody className="space-y-4 py-1">
 *       {formFields}
 *     </ScrollableDialogBody>
 *     <DialogFooter className="shrink-0 gap-1.5">
 *       <Button>Cancel</Button>
 *       <Button>Save</Button>
 *     </DialogFooter>
 *   </ScrollableDialogContent>
 * </Dialog>
 * ```
 */
function ScrollableDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn("max-h-[85vh] flex flex-col", className)}
      {...props}
    >
      {children}
    </DialogContent>
  )
}

/**
 * ScrollableDialogBody — wraps form content that should scroll when it overflows.
 * Use as the middle child of `ScrollableDialogContent`, between
 * `DialogHeader` (top) and `DialogFooter` (bottom).
 */
function ScrollableDialogBody({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("overflow-y-auto flex-1 min-h-0 pr-1 -mr-1", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { ScrollableDialogContent, ScrollableDialogBody }
