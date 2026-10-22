export const SITE_NAME = "Visit In Tampa";
export const SITE_URL = "https://visitintampa.com";

export function withSiteName(page: string) {
  return `${page} — ${SITE_NAME}`;
}
