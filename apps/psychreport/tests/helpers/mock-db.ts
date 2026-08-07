/**
 * Minimal chainable mock of the Supabase query builder, enough for the
 * lib cores under test. Configure per-table results; every chain method
 * returns the builder; awaiting it (or maybeSingle()) yields {data, error}.
 * Inserts are recorded for assertions.
 */

export interface TableConfig {
  rows?: unknown;
  error?: { message: string } | null;
  maybeSingleRow?: unknown;
}

export interface InsertRecord {
  table: string;
  values: unknown;
}

export function makeMockDb(tables: Record<string, TableConfig>) {
  const inserts: InsertRecord[] = [];

  const db = {
    inserts,
    from(table: string) {
      const cfg = tables[table] ?? {};
      const result = { data: cfg.rows ?? [], error: cfg.error ?? null };
      const builder: any = {
        select: () => builder,
        eq: () => builder,
        is: () => builder,
        order: () => builder,
        maybeSingle: async () => ({
          data: cfg.maybeSingleRow ?? null,
          error: cfg.error ?? null,
        }),
        insert: (values: unknown) => {
          inserts.push({ table, values });
          const insBuilder: any = {
            select: () => insBuilder,
            single: async () => ({ data: { id: "mock-id" }, error: null }),
            then: (resolve: (v: unknown) => void) =>
              resolve({ data: null, error: null }),
          };
          return insBuilder;
        },
        then: (resolve: (v: unknown) => void) => resolve(result),
      };
      return builder;
    },
  };
  return db;
}
