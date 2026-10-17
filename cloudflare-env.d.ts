declare global {
  interface CloudflareEnv {
    DB: D1Database;
    PHOTOS: R2Bucket;
    LISTING_CONTENT: R2Bucket;
  }
}

export {};
