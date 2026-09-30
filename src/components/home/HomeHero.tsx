import Image from "next/image";
import Link from "next/link";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1585463857724-eb1a3e57ef06?auto=format&fit=crop&w=2000&q=80";

const PILLS = [
  { label: "Food & drink", href: "/food-and-drink" },
  { label: "Things to do", href: "/things-to-do" },
  { label: "Neighborhoods", href: "/neighborhoods" },
] as const;

export function HomeHero() {
  return (
    <section className="relative h-[520px] md:h-[600px] w-full overflow-hidden">
      <Image
        src={HERO_IMAGE}
        alt="Downtown Tampa skyline across the water at night"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(8,52,60,0.1) 0%, rgba(8,52,60,0.88) 100%)",
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-14">
        <div className="max-w-[720px]">
          <div className="flex flex-wrap gap-2">
            {PILLS.map((pill) => (
              <Link
                key={pill.href}
                href={pill.href}
                className="bg-white/15 text-white text-[13px] font-medium px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-white/25 hover:text-white"
              >
                {pill.label}
              </Link>
            ))}
          </div>
          <h1 className="font-display font-medium text-[36px] md:text-[56px] text-white leading-[1.12] mt-4">
            A local&apos;s guide to Tampa Bay.
          </h1>
          <p className="text-[16px] md:text-[19px] text-[#E3EFF0] mt-3 max-w-[480px]">
            Stories, spots, and honest opinions from people who actually live here.
          </p>
          <a
            href="#featured-stories"
            className="mt-6 inline-block text-[14px] text-[#E3EFF0] hover:text-white"
          >
            Start exploring ↓
          </a>
        </div>
      </div>
    </section>
  );
}
