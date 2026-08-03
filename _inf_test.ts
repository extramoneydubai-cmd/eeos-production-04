type P = { _id: string; name?: string; code?: string; isActive: boolean };
const programs: P[] | undefined = undefined;

// A: classic T[] param, non-union arg
const fA = <T extends { name?: string }>(items: T[]) => items.filter((i) => i.name);
fA(programs!).map((x) => x._id);

// B: whole-array T, no undefined in constraint
const fB = <T extends Array<{ name?: string }>>(items: T) => items.filter((i) => i.name);
fB(programs!).map((x) => x._id);

// C: whole-array T with | undefined in constraint
const fC = <T extends Array<{ name?: string }> | undefined>(items: T) => items.filter((i) => i.name);
fC(programs!).map((x) => x._id);

// D: whole-array T with | undefined in constraint, arg union
const fD = <T extends Array<{ name?: string }> | undefined>(items: T) => items.filter((i) => i.name);
fD(programs).map((x) => x._id);

export {};
