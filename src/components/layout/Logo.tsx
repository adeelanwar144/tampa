import Image from "next/image";
import Link from "next/link";
import { focusRing, motion150 } from "@/components/layout/nav";

const LOGO_WIDTH = 798;
const LOGO_HEIGHT = 358;

export function Logo() {
  return (
    <Link
      href="/"
      className={`flex h-14 shrink-0 items-center rounded-sm md:h-16 lg:h-[72px] xl:h-20 ${focusRing} ${motion150}`}
    >
      <Image
        src="/brand/logo.png"
        alt="Visit In Tampa"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority
        style={{ width: "auto", height: "100%" }}
        className="h-full w-auto max-w-[46vw] object-contain"
      />
    </Link>
  );
}
