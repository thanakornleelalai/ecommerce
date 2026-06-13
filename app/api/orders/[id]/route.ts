import { NextResponse } from "next/server";
import {
  query,
  execute,
  type Order,
  type OrderItem,
  type OrderWithItems,
  type RowDataPacket,
} from "@/lib/db";

export const dynamic = "force-dynamic";

interface OrderRow extends Order, RowDataPacket {
  customer_name: string | null;
}
interface OrderItemRow extends OrderItem, RowDataPacket {
  product_name: string | null;
}

type Params = { params: Promise<{ id: string }> };

// GET /api/orders/[id] → one order with its items, or 404
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const [order] = await query<OrderRow>(
      `SELECT o.id, o.customer_id, o.total, o.status, o.created_at,
              c.name AS customer_name
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       WHERE o.id = ?`,
      [orderId]
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = await query<OrderItemRow>(
      `SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price,
              p.name AS product_name
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    const response: OrderWithItems = { ...order, items };
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("GET /api/orders/[id] failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] → update order status
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const status = typeof body?.status === "string" ? body.status.trim() : "";

    if (!status) {
      return NextResponse.json({ error: "'status' is required" }, { status: 400 });
    }
    if (!["pending", "paid", "shipped", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }

    const result = await execute("UPDATE orders SET status = ? WHERE id = ?", [
      status,
      orderId,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const [updated] = await query<OrderRow>(
      `SELECT o.id, o.customer_id, o.total, o.status, o.created_at,
              c.name AS customer_name
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       WHERE o.id = ?`,
      [orderId]
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/orders/[id] failed:", err);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] → delete order (order_items cascade via FK)
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const result = await execute("DELETE FROM orders WHERE id = ?", [orderId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Order deleted" }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/orders/[id] failed:", err);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
