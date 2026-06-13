import { NextResponse, NextRequest } from "next/server";
import { query, execute, type Customer, type RowDataPacket } from "@/lib/db";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/upload";

export const dynamic = "force-dynamic";

interface CustomerRow extends Customer, RowDataPacket {}

type Params = { params: Promise<{ id: string }> };

// GET /api/customers/[id] → one customer or 404
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const customerId = Number(id);
    if (!Number.isInteger(customerId) || customerId <= 0) {
      return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
    }

    const [customer] = await query<CustomerRow>(
      "SELECT id, name, email, image_url, created_at FROM customers WHERE id = ?",
      [customerId]
    );

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer, { status: 200 });
  } catch (err) {
    console.error("GET /api/customers/[id] failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

// PATCH /api/customers/[id] → update customer
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const customerId = Number(id);
    if (!Number.isInteger(customerId) || customerId <= 0) {
      return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
    }

    // Get current customer to preserve image if not updating
    const [currentCustomer] = await query<CustomerRow>(
      "SELECT id, name, email, image_url, created_at FROM customers WHERE id = ?",
      [customerId]
    );

    if (!currentCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const formData = await req.formData().catch(() => null);
    const name = formData?.get("name") as string | null;
    const email = formData?.get("email") as string | null;
    const imageFile = formData?.get("image") as File | null;

    const trimmedName = typeof name === "string" ? name.trim() : currentCustomer.name;
    const trimmedEmail = typeof email === "string" ? email.trim() : currentCustomer.email;

    if (!trimmedName || !trimmedEmail) {
      return NextResponse.json(
        { error: "Both 'name' and 'email' are required" },
        { status: 400 }
      );
    }

    let imageUrl = currentCustomer.image_url;
    if (imageFile && imageFile.size > 0) {
      try {
        // Delete old image if exists
        if (currentCustomer.image_url) {
          await deleteUploadedFile(currentCustomer.image_url);
        }
        imageUrl = await saveUploadedFile(imageFile);
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Failed to upload image" },
          { status: 400 }
        );
      }
    }

    const result = await execute(
      "UPDATE customers SET name = ?, email = ?, image_url = ? WHERE id = ?",
      [trimmedName, trimmedEmail, imageUrl, customerId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const [updated] = await query<CustomerRow>(
      "SELECT id, name, email, image_url, created_at FROM customers WHERE id = ?",
      [customerId]
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "ER_DUP_ENTRY"
    ) {
      return NextResponse.json(
        { error: "A customer with that email already exists" },
        { status: 400 }
      );
    }
    console.error("PATCH /api/customers/[id] failed:", err);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] → delete customer
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const customerId = Number(id);
    if (!Number.isInteger(customerId) || customerId <= 0) {
      return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
    }

    const result = await execute("DELETE FROM customers WHERE id = ?", [
      customerId,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Customer deleted" }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/customers/[id] failed:", err);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
