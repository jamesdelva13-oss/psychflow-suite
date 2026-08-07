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
  /** Error returned by insert() on this table (e.g. a trigger refusal). */
  insertError?: { message: string; code?: string } | null;
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
          const insErr = cfg.insertError ?? null;
          if (!insErr) inserts.push({ table, values });
          const insBuilder: any = {
            select: () => insBuilder,
            single: async () => ({
              data: insErr ? null : { id: "mock-id" },
              error: insErr,
            }),
            then: (resolve: (v: unknown) => void) =>
              resolve({ data: null, error: insErr }),
          };
          return insBuilder;
        },
        then: (resolve: (v: unknown) => void) => resolve(result),
      };
      return builder;
    },
    /** db_now() answers with the mock's clock; other RPCs must be added here. */
    rpc: async (fn: string) =>
      fn === "db_now"
        ? { data: new Date().toISOString(), error: null }
        : { data: null, error: { message: `mock-db: no rpc ${fn}` } },
  };
  return db;
}
