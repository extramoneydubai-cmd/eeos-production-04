import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ChevronDown, ChevronUp, ChevronsUpDown, Inbox } from "lucide-react";
import { type ReactNode, useMemo } from "react";

export type SortDirection = "asc" | "desc";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  sortKey?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  rowClassName?: (item: T) => string | undefined;
  onRowClick?: (item: T) => void;
}

function SortIcon({
  columnKey,
  sortKey,
  sortDirection,
}: {
  columnKey: string;
  sortKey?: string;
  sortDirection?: SortDirection;
}) {
  if (sortKey !== columnKey) {
    return <ChevronsUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />;
  }
  return sortDirection === "asc" ? (
    <ChevronUp className="ml-1 h-3 w-3" />
  ) : (
    <ChevronDown className="ml-1 h-3 w-3" />
  );
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  sortKey,
  sortDirection,
  onSort,
  emptyTitle = "No data",
  emptyDescription = "There are no items to display.",
  emptyIcon,
  rowClassName,
  onRowClick,
}: DataTableProps<T>) {
  const skeletonRows = useMemo(() => Array.from({ length: 5 }), []);

  if (isLoading) {
    return (
      <div className="rounded-sm border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.headerClassName}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {skeletonRows.map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-sm border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.headerClassName}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {emptyIcon || <Inbox className="h-5 w-5" />}
            </EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={col.headerClassName}
              >
                {col.sortable ? (
                  <button
                    onClick={() => onSort?.(col.key)}
                    className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                  >
                    {col.label}
                    <SortIcon
                      columnKey={col.key}
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                    />
                  </button>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {col.label}
                  </span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={keyExtractor(item)}
              className={rowClassName?.(item)}
              onClick={() => onRowClick?.(item)}
              style={{ cursor: onRowClick ? "pointer" : undefined }}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
