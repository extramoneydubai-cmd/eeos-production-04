/**
 * WorkspaceHeader — legacy compact workspace header (title + subtitle + accent).
 *
 * Provided for pages that pass a custom `header` node to WorkspaceShell.
 */

/** Legacy workspace header — title, subtitle and accent color strip. */
export function WorkspaceHeader({
  title,
  subtitle,
  color,
}: {
  title: string;
  subtitle?: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className="h-10 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color || "var(--primary)" }}
      />
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground/70 truncate">{subtitle}</p>}
      </div>
    </div>
  );
}
