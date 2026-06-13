import { NextResponse, NextRequest } from "next/server";
import { query, execute, type Product, type RowDataPacket } from "@/lib/db";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/upload";

export const dynamic = "force-dynamic";

interface ProductRow extends Product, RowDataPacket {}

type Params = { params: Promise<{ id: string }> };

// GET /api/products/[id] → one product or 404
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    const [product] = await query<ProductRow>(
      "SELECT id, name, price, stock, image_url, created_at FROM products WHERE id = ?",
      [productId]
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (err) {
    console.error("GET /api/products/[id] failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id] → update product
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    // Get current product to preserve image if not updating
    const [currentProduct] = await query<ProductRow>(
      "SELECT id, name, price, stock, image_url, created_at FROM products WHERE id = ?",
      [productId]
    );

    if (!currentProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const formData = await req.formData().catch(() => null);
    const name = formData?.get("name") as string | null;
    const priceRaw = formData?.get("price");
    const stockRaw = formData?.get("stock");
    const price = priceRaw != null && priceRaw !== "" ? Number(priceRaw) : NaN;
    const stock = stockRaw != null && stockRaw !== "" ? Number(stockRaw) : NaN;
    const imageFile = formData?.get("image") as File | null;

    const trimmedName = typeof name === "string" ? name.trim() : currentProduct.name;
    const updatedPrice: number = Number.isFinite(price) ? price : currentProduct.price;
    const updatedStock: number = Number.isInteger(stock) ? stock : currentProduct.stock;

    if (!trimmedName) {
      return NextResponse.json({ error: "'name' is required" }, { status: 400 });
    }
    if (!Number.isFinite(updatedPrice) || updatedPrice < 0) {
      return NextResponse.json(
        { error: "'price' must be a non-negative number" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(updatedStock) || updatedStock < 0) {
      return NextResponse.json(
        { error: "'stock' must be a non-negative integer" },
        { status: 400 }
      );
    }

    let imageUrl = currentProduct.image_url;
    if (imageFile && imageFile.size > 0) {
      try {
        // Delete old image if exists
        if (currentProduct.image_url) {
          await deleteUploadedFile(currentProduct.image_url);
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
      "UPDATE products SET name = ?, price = ?, stock = ?, image_url = ? WHERE id = ?",
      [trimmedName, updatedPrice, updatedStock, imageUrl, productId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const [updated] = await query<ProductRow>(
      "SELECT id, name, price, stock, image_url, created_at FROM products WHERE id = ?",
      [productId]
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/products/[id] failed:", err);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] → delete product
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    const result = await execute("DELETE FROM products WHERE id = ?", [
      productId,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Product deleted" }, { status: 200 });
  } catch (err: unknown) {
    // Product referenced by an order_item (ON DELETE RESTRICT)
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "ER_ROW_IS_REFERENCED_2"
    ) {
      return NextResponse.json(
        { error: "Cannot delete a product that belongs to an order" },
        { status: 400 }
      );
    }
    console.error("DELETE /api/products/[id] failed:", err);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
