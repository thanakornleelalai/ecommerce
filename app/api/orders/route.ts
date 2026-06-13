import { NextRequest, NextResponse } from "next/server";
import {
  pool,
  query,
  type Order,
  type Product,
  type RowDataPacket,
  type ResultSetHeader,
} from "@/lib/db";

export const dynamic = "force-dynamic";

interface OrderListRow extends Order, RowDataPacket {
  customer_name: string | null;
}

interface ProductStockRow extends RowDataPacket, Pick<Product, "id" | "price" | "stock" | "name"> {}

/** Shape of an item in the POST /api/orders request body. */
interface OrderItemInput {
  product_id: number;
  quantity: number;
}

// GET /api/orders → all orders (with customer name)
export async function GET() {
  try {
    const orders = await query<OrderListRow>(
      `SELECT o.id, o.customer_id, o.total, o.status, o.created_at,
              c.name AS customer_name
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       ORDER BY o.id DESC`
    );
    return NextResponse.json(orders, { status: 200 });
  } catch (err) {
    console.error("GET /api/orders failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders → create order (transactional, stock-checked)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const customerId = Number(body?.customer_id);
  const rawItems: unknown = body?.items;

  // ---- validate the request shape (before touching the DB) ----
  if (!Number.isInteger(customerId) || customerId <= 0) {
    return NextResponse.json(
      { error: "'customer_id' is required and must be a valid id" },
      { status: 400 }
    );
  }
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json(
      { error: "'items' must be a non-empty array" },
      { status: 400 }
    );
  }

  const items: OrderItemInput[] = [];
  for (const raw of rawItems) {
    const product_id = Number((raw as OrderItemInput)?.product_id);
    const quantity = Number((raw as OrderItemInput)?.quantity);
    if (!Number.isInteger(product_id) || product_id <= 0) {
      return NextResponse.json(
        { error: "Each item needs a valid 'product_id'" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: "Each item needs a 'quantity' >= 1" },
        { status: 400 }
      );
    }
    items.push({ product_id, quantity });
  }

  // ---- transactional write ----
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Ensure the customer exists.
    const [customerRows] = await conn.query<RowDataPacket[]>(
      "SELECT id FROM customers WHERE id = ?",
      [customerId]
    );
    if (customerRows.length === 0) {
      await conn.rollback();
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Lock product rows and validate stock.
    let total = 0;
    const lineItems: { product_id: number; quantity: number; price: number }[] = [];

    for (const item of items) {
      const [rows] = await conn.query<ProductStockRow[]>(
        "SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE",
        [item.product_id]
      );
      const product = rows[0];

      if (!product) {
        await conn.rollback();
        return NextResponse.json(
          { error: `Product ${item.product_id} not found` },
          { status: 404 }
        );
      }
      if (product.stock < item.quantity) {
        await conn.rollback();
        return NextResponse.json(
          {
            error: `Insufficient stock for "${product.name}". Requested ${item.quantity}, available ${product.stock}`,
          },
          { status: 400 }
        );
      }

      total += Number(product.price) * item.quantity;
      lineItems.push({
        product_id: product.id,
        quantity: item.quantity,
        price: Number(product.price),
      });
    }

    // Create the order header.
    const [orderResult] = await conn.execute<ResultSetHeader>(
      "INSERT INTO orders (customer_id, total, status) VALUES (?, ?, ?)",
      [customerId, total, "pending"]
    );
    const orderId = orderResult.insertId;

    // Insert line items and decrement stock.
    for (const li of lineItems) {
      await conn.execute(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, li.product_id, li.quantity, li.price]
      );
      await conn.execute(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [li.quantity, li.product_id]
      );
    }

    await conn.commit();

    return NextResponse.json(
      {
        id: orderId,
        customer_id: customerId,
        total,
        status: "pending",
        items: lineItems,
      },
      { status: 201 }
    );
  } catch (err) {
    await conn.rollback();
    console.error("POST /api/orders failed, rolled back:", err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}
