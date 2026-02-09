import { getPool } from '@server/services/db';

type ColumnMapping<T> = {
  [K in keyof T]: string;
};

/**
 * Transforms a database row from snake_case to camelCase based on the provided mapping
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformRow<T>(row: Record<string, any>, mapping: ColumnMapping<T>): T {
  const result: Partial<T> = {};

  for (const [camelKey, snakeKey] of Object.entries(mapping) as [keyof T, string][]) {
    if (snakeKey in row) {
      result[camelKey] = row[snakeKey];
    }
  }

  return result as T;
}

/**
 * Executes a database query and transforms the results from snake_case to camelCase
 */
export async function queryRows<T>({
  query,
  params,
  mapping,
  commandIdentifier,
}: {
  query: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[];
  mapping: ColumnMapping<T>;
  commandIdentifier: string;
}): Promise<T[]> {
  const pool = getPool();
  try {
    const result = await pool.query(query, params);
    return result.rows.map(row => transformRow(row, mapping));
  } catch (error) {
    throw new Error(
      `Error executing query ${commandIdentifier}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Executes a database query and returns a single row, transformed from snake_case to camelCase.
 * Throws an error if no rows or multiple rows are found.
 */
export async function querySingleRow<T>(args: {
  query: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[];
  mapping: ColumnMapping<T>;
  commandIdentifier: string;
  allowNull: true;
}): Promise<T | null>;
export async function querySingleRow<T>(args: {
  query: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[];
  mapping: ColumnMapping<T>;
  commandIdentifier: string;
  allowNull?: false;
}): Promise<T>;
export async function querySingleRow<T>({
  query,
  params,
  mapping,
  commandIdentifier,
  allowNull = false,
}: {
  query: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[];
  mapping: ColumnMapping<T>;
  commandIdentifier: string;
  allowNull?: boolean;
}): Promise<T | null> {
  const rows = await queryRows<T>({
    query,
    params,
    mapping,
    commandIdentifier,
  });

  if (rows.length > 1) {
    throw new Error(`Multiple results found for command ${commandIdentifier}`);
  }

  if (rows.length === 0 && !allowNull) {
    throw new Error(`No results found for command ${commandIdentifier}`);
  }

  return rows[0] ?? null;
}

/**
 * Executes a database query and just returns the scalar value.
 */
export async function queryScalar<T>(args: {
  query: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[];
  allowNull: true;
  commandIdentifier: string;
}): Promise<T | null>;
export async function queryScalar<T>(args: {
  query: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[];
  allowNull?: false;
  commandIdentifier: string;
}): Promise<T>;
export async function queryScalar<T>({
  query,
  params,
  allowNull = false,
  commandIdentifier,
}: {
  query: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[];
  allowNull?: boolean;
  commandIdentifier: string;
}): Promise<T | null> {
  const pool = getPool();
  try {
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      if (allowNull) {
        return null;
      }
      throw new Error(`No results found for command ${commandIdentifier}`);
    }

    return Object.values(result.rows[0])[0] as T;
  } catch (error) {
    if (error instanceof Error && error.message.includes('No results found')) {
      throw error;
    }
    throw new Error(
      `Error executing query ${commandIdentifier}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Executes a database query and don't return any results.
 */
export async function nonQuery({
  query,
  params,
  commandIdentifier,
}: {
  query: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[];
  commandIdentifier: string;
}): Promise<void> {
  const pool = getPool();
  try {
    await pool.query(query, params);
  } catch (error) {
    throw new Error(
      `Error executing query ${commandIdentifier}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
