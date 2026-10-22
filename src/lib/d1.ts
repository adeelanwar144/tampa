import { getCloudflareContext } from "@opennextjs/cloudflare";
import { connection } from "next/server";

export async function getDb() {
  await connection();
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.DB ?? null;
  } catch {
    return null;
  }
}

export async function getPhotosBucket() {
  await connection();
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.PHOTOS ?? null;
  } catch {
    return null;
  }
}

export async function getListingContentBucket() {
  await connection();
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.LISTING_CONTENT ?? null;
  } catch {
    return null;
  }
}
