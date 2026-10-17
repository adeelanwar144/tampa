export const MOBILE_MENU_EVENT = "tampa:mobile-menu";

export function setMobileMenuOpen(open: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MOBILE_MENU_EVENT, { detail: { open } }));
}
