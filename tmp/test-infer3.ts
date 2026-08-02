type Id<T extends string> = string & { __brand: T };
type QueryResult = { _id: Id<"academicPrograms">; name: string; code: string; color: string; isActive: boolean }[];
declare function useQuery<T>(): T | undefined;
const programs = useQuery<QueryResult>();
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
