import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

interface LoadingStateProps {
  type?: "spinner" | "skeleton" | "page";
  label?: string;
}

export function LoadingState({
  type = "spinner",
  label,
}: LoadingStateProps) {
  if (type === "page") {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (type === "skeleton") {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-5 w-5 text-muted-foreground" />
          {label && (
            <p className="text-sm text-muted-foreground">{label}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-5 w-5 text-muted-foreground" />
        {label && (
          <p className="text-sm text-muted-foreground">{label}</p>
        )}
      </div>
    </div>
  );
}
