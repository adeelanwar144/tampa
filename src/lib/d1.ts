import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getDb() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.DB ?? null;
  } catch {
    return null;
  }
}

export async function getPhotosBucket() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.PHOTOS ?? null;
  } catch {
    return null;
  }
}
