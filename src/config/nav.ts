export interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Things to do", href: "/things-to-do" },
  { label: "Food & drink", href: "/food-and-drink" },
  { label: "Sports & Entertainment", href: "/events" },
  { label: "Neighborhoods", href: "/neighborhoods" },
  { label: "Outdoors & beaches", href: "/outdoors-beaches" },
  { label: "Shopping", href: "/shopping" },
  { label: "Guides", href: "/guides" },
  { label: "Getting around", href: "/getting-around" },
];

export const directoryCta = { label: "Directory", href: "/directory" };

export const MORE_NAV_LABELS = ["Outdoors & beaches", "Shopping", "Guides", "Getting around"] as const;

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
