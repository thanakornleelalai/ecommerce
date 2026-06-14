import { NextRequest, NextResponse } from "next/server";
import { query, execute, type Customer, type RowDataPacket } from "@/lib/db";
import { saveUploadedFile } from "@/lib/upload";


export const dynamic = "force-dynamic";

interface CustomerRow extends Customer, RowDataPacket {}

// GET /api/customers → all customers
export async function GET() {
  try {
    const customers = await query<CustomerRow>(
      "SELECT id, name, email, image_url, created_at FROM customers ORDER BY id DESC"
    );
    return NextResponse.json(customers, { status: 200 });
  } catch (err) {
    console.error("GET /api/customers failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST /api/customers → create customer
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const imageFile = formData.get("image") as File | null;

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedEmail = typeof email === "string" ? email.trim() : "";

    if (!trimmedName || !trimmedEmail) {
      return NextResponse.json(
        { error: "Both 'name' and 'email' are required" },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      try {
        imageUrl = await saveUploadedFile(imageFile);
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Failed to upload image" },
          { status: 400 }
        );
      }
    }

    const result = await execute(
      "INSERT INTO customers (name, email, image_url) VALUES (?, ?, ?)",
      [trimmedName, trimmedEmail, imageUrl]
    );

    const [created] = await query<CustomerRow>(
      "SELECT id, name, email, image_url, created_at FROM customers WHERE id = ?",
      [result.insertId]
    );

    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    // Duplicate email (UNIQUE constraint)
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
    console.error("POST /api/customers failed:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create customer";
    return NextResponse.json(
      { error: `Failed to create customer: ${message}` },
      { status: 500 }
    );
  }
}
