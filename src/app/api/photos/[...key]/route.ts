import { NextRequest } from "next/server";
import { getPhotosBucket } from "@/lib/d1";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.join("/");
  if (!objectKey.startsWith("places/") || objectKey.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const bucket = await getPhotosBucket();
  if (!bucket) return new Response("Not found", { status: 404 });

  const object = await bucket.get(objectKey);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType ?? "image/jpeg",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
