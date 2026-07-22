import { DashboardLayout } from "./DashboardLayout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import type { ReactNode } from "react";

interface StudioBreadcrumbItem {
  label: string;
  href?: string;
}

interface StudioLayoutProps {
  title: string;
  description?: string;
  breadcrumbItems?: StudioBreadcrumbItem[];
  children: ReactNode;
  actions?: ReactNode;
}

export function StudioLayout({
  title,
  description,
  breadcrumbItems = [],
  children,
  actions,
}: StudioLayoutProps) {
  const breadcrumb = breadcrumbItems.length > 0 && (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, i) => {
          const isLast = i === breadcrumbItems.length - 1;
          return (
            <BreadcrumbItem key={item.label}>
              {isLast ? (
                <BreadcrumbPage className="text-xs font-normal">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink
                    href={item.href || "#"}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <DashboardLayout breadcrumb={breadcrumb} actions={actions}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-normal tracking-tight">{title}</h1>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
          <Separator className="mt-4" />
        </div>
        {children}
      </div>
    </DashboardLayout>
  );
}
