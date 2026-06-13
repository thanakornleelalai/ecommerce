import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create upload directory:", err);
  }
}

export async function saveUploadedFile(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error("No file provided");
  }

  // Validate file type (images only)
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size must be less than 5MB");
  }

  await ensureUploadDir();

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${randomBytes(8).toString("hex")}.${ext}`;
  const filepath = join(UPLOAD_DIR, filename);

  await writeFile(filepath, buffer);

  // Return the URL path (relative to public directory)
  return `/uploads/${filename}`;
}

export async function deleteUploadedFile(imageUrl: string | null) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) {
    return;
  }

  try {
    const { unlink } = await import("fs/promises");
    const filepath = join(process.cwd(), "public", imageUrl);
    await unlink(filepath);
  } catch (err) {
    console.error("Failed to delete file:", err);
  }
}
