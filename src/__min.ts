export const A = [{ id: "x", count: 0 }];
export const m = new Map(((undefined as any) ?? []).map((d: any) => [d.domain, d.count]));
export const B = A.filter(() => true).map((d) => {
  const __v: number = m.get(d.id) ?? d.count;
  return __v;
});
