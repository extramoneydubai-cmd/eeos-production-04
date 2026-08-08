import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

declare const search: string;

export default function Probe() {
  const programs = useQuery(api.academicPrograms.listAcademicPrograms);
  // A: what is programs' element type?
  const a: { _id: string } | undefined = programs?.[0];
  // B: does filterItems infer T correctly from the same value?
  const filterItems = <T,>(items: T[] | undefined): T[] =>
    (items || []).filter(
      (i) =>
        !search ||
        ((i as { name?: string }).name ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        ((i as { code?: string }).code ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  const b: { _id: string }[] = filterItems(programs);
  return null;
}
