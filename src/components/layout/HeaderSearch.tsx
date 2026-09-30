import { Search } from "lucide-react";
import { focusRing, motion150 } from "@/components/layout/nav";

export function HeaderSearch() {
  return (
    <form
      action="/search"
      method="get"
      className="w-full max-w-[560px]"
      role="search"
    >
      <div
        className={`group relative h-[46px] w-full rounded-full border border-[#DCE4E3] bg-[#F2F5F4] ${motion150} focus-within:border-[#1B8B99] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0B5E6B]/10`}
      >
        <Search
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-[18px] -translate-y-1/2 text-[#4A626A]"
        />
        <label htmlFor="header-search" className="sr-only">
          Search places, food, neighborhoods
        </label>
        <input
          id="header-search"
          type="search"
          name="q"
          placeholder="Search places, food, neighborhoods"
          className="h-full w-full rounded-full bg-transparent pr-14 pl-12 text-[15px] text-[#08343C] placeholder:text-[#4A626A] focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Submit search"
          className={`absolute top-1/2 right-[6px] flex size-[34px] -translate-y-1/2 items-center justify-center rounded-full bg-[#0B5E6B] text-white ${motion150} hover:bg-[#1B8B99] ${focusRing}`}
        >
          <Search size={16} />
        </button>
      </div>
    </form>
  );
}
