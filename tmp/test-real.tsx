import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function T() {
  const programs = useQuery(api.academicPrograms.listAcademicPrograms);
  const search: string = "";
  const filterItems = <T extends { name?: string; code?: string }>(
    items: T[] | undefined,
  ) =>
    (items || []).filter(
      (i) =>
        !search ||
        (i.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (i.code || "").toLowerCase().includes(search.toLowerCase()),
    );
  filterItems(programs).map((p) => p._id);
  return null;
}
