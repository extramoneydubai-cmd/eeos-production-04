import { api } from "./_generated/api";
import type { FunctionReturnType } from "convex/server";

type R = FunctionReturnType<typeof api.academicPrograms.listAcademicPrograms>;

// Replicate the page's filterItems inference pattern
const search = "";
function filterItems<T extends { name?: string; code?: string }>(
  items: T[] | undefined,
) {
  return (items || []).filter(
    (i) =>
      !search ||
      (i.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.code || "").toLowerCase().includes(search.toLowerCase()),
  );
}

const programs = null as unknown as R | undefined;
const mapped = filterItems(programs);
const revealId: { _id: string } = mapped[0];
const revealColor: { color: string } = mapped[0];

export const probe = { revealId, revealColor };
