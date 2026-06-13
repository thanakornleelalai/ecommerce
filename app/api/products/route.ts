import { NextRequest, NextResponse } from "next/server";
import { query, execute, type Product, type RowDataPacket } from "@/lib/db";
import { saveUploadedFile } from "@/lib/upload";

export const dynamic = "force-dynamic";

interface ProductRow extends Product, RowDataPacket {}

// GET /api/products → all products
export async function GET() {
  try {
    const products = await query<ProductRow>(
      "SELECT id, name, price, stock, image_url, created_at FROM products ORDER BY id DESC"
    );
    return NextResponse.json(products, { status: 200 });
  } catch (err) {
    console.error("GET /api/products failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products → create product
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));
    const imageFile = formData.get("image") as File | null;

    const trimmedName = typeof name === "string" ? name.trim() : "";

    if (!trimmedName) {
      return NextResponse.json({ error: "'name' is required" }, { status: 400 });
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "'price' must be a non-negative number" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        { error: "'stock' must be a non-negative integer" },
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
      "INSERT INTO products (name, price, stock, image_url) VALUES (?, ?, ?, ?)",
      [trimmedName, price, stock, imageUrl]
    );

    const [created] = await query<ProductRow>(
      "SELECT id, name, price, stock, image_url, created_at FROM products WHERE id = ?",
      [result.insertId]
    );

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/products failed:", err);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
