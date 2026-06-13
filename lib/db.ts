import mysql, { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";

/* ------------------------------------------------------------------ */
/* Domain types / interfaces                                           */
/* ------------------------------------------------------------------ */

export interface Customer {
  id: number;
  name: string;
  email: string;
  image_url: string | null;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  created_at: string;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "cancelled";

export interface Order {
  id: number;
  customer_id: number;
  total: number;
  status: OrderStatus;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
}

/** An order joined with its line items (used by GET /api/orders/[id]). */
export interface OrderWithItems extends Order {
  customer_name?: string | null;
  items: OrderItem[];
}

/* ------------------------------------------------------------------ */
/* Connection pool (singleton)                                         */
/* ------------------------------------------------------------------ */

// In dev, Next.js hot-reload re-imports modules; cache the pool on globalThis
// so we don't open a new pool on every reload.
declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: Pool | undefined;
}

function createPool(): Pool {
  const useSsl = process.env.DB_SSL === "true";

  return mysql.createPool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "ecommerce",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true, // return DECIMAL columns as JS numbers, not strings
    // SSL config for managed MySQL such as TiDB Cloud.
    ...(useSsl ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } } : {}),
  });
}

export const pool: Pool = global.__mysqlPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  global.__mysqlPool = pool;
}

/* ------------------------------------------------------------------ */
/* Query helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * Run a SELECT and get back typed rows.
 * Always use parameterized queries: query("... WHERE id = ?", [id]).
 */
export async function query<T extends RowDataPacket>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const [rows] = await pool.query<T[]>(sql, params as never[]);
  return rows;
}

/**
 * Run an INSERT/UPDATE/DELETE and get back the result header
 * (insertId, affectedRows, etc.).
 */
export async function execute(
  sql: string,
  params: unknown[] = []
): Promise<ResultSetHeader> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params as never[]);
  return result;
}

export type { RowDataPacket, ResultSetHeader };
