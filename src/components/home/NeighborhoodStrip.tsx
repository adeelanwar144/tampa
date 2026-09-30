"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { NEIGHBORHOODS } from "@/lib/listings";
import { NEIGHBORHOOD_PHOTOS, neighborhoodSlug } from "@/data/neighborhood-photos";
import { focusRing, motion150 } from "@/components/layout/nav";

const SPEED_PX_PER_SEC = 62;
const RESUME_DELAY_MS = 2000;

const neighborhoods = [...NEIGHBORHOODS].sort((a, b) => {
  if (a === "Ybor City") return -1;
  if (b === "Ybor City") return 1;
  return 0;
});

const loopedNeighborhoods = [...neighborhoods, ...neighborhoods];

function NeighborhoodCard({
  name,
}: {
  name: (typeof neighborhoods)[number];
}) {
  const photo = NEIGHBORHOOD_PHOTOS[name];
  const featured = name === "Ybor City";

  return (
    <Link
      href={`/neighborhoods/${neighborhoodSlug(name)}`}
      className={[
        "relative flex-shrink-0 overflow-hidden rounded-xl",
        featured ? "w-[220px] h-[220px]" : "w-[180px] h-[220px]",
      ].join(" ")}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        className="object-cover"
        sizes={featured ? "220px" : "180px"}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(8,52,60,0) 45%, rgba(8,52,60,0.82) 100%)",
        }}
      />
      <p className="absolute bottom-3 left-3 right-3 font-display font-medium text-[16px] text-white leading-snug">
        {name}
      </p>
    </Link>
  );
}

export function NeighborhoodStrip() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const hoveringRef = useRef(false);
  const focusingRef = useRef(false);
  const pointerDownRef = useRef(false);
  const recentInputRef = useRef(false);
  const userStoppedRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const [userStopped, setUserStopped] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  function clearResumeTimer() {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }

  function syncPaused() {
    isPausedRef.current =
      reducedMotionRef.current ||
      userStoppedRef.current ||
      hoveringRef.current ||
      focusingRef.current ||
      pointerDownRef.current ||
      recentInputRef.current ||
      document.visibilityState !== "visible";
    if (isPausedRef.current) lastTimeRef.current = null;
  }

  function scheduleResume() {
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(() => {
      recentInputRef.current = false;
      syncPaused();
    }, RESUME_DELAY_MS);
  }

  function toggleAutoScroll() {
    const next = !userStoppedRef.current;
    userStoppedRef.current = next;
    setUserStopped(next);
    clearResumeTimer();
    syncPaused();
  }

  useEffect(() => {
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    function applyReducedMotion(matches: boolean) {
      reducedMotionRef.current = matches;
      setReducedMotion(matches);
      syncPaused();
    }
    applyReducedMotion(media.matches);

    function onMediaChange(event: MediaQueryListEvent) {
      applyReducedMotion(event.matches);
    }
    media.addEventListener("change", onMediaChange);

    function getSetWidth() {
      const cards = trackRef.current?.children;
      if (!cards || cards.length < neighborhoods.length + 1) return 0;
      const first = cards[0] as HTMLElement;
      const firstOfSecond = cards[neighborhoods.length] as HTMLElement;
      return firstOfSecond.offsetLeft - first.offsetLeft;
    }

    function wrapScroll() {
      const el = scrollerRef.current;
      if (!el) return;
      const setWidth = getSetWidth();
      if (setWidth <= 0) return;
      if (el.scrollLeft >= setWidth) {
        el.scrollLeft -= setWidth;
      } else if (el.scrollLeft < 0) {
        el.scrollLeft += setWidth;
      }
    }

    let cancelled = false;

    function tick(now: number) {
      if (cancelled) return;
      const el = scrollerRef.current;
      if (!el) return;

      if (lastTimeRef.current == null) {
        lastTimeRef.current = now;
      }

      const elapsed = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      if (!isPausedRef.current) {
        el.scrollLeft += SPEED_PX_PER_SEC * elapsed;
        wrapScroll();
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    function onMouseEnter() {
      hoveringRef.current = true;
      clearResumeTimer();
      syncPaused();
    }

    function onMouseLeave() {
      hoveringRef.current = false;
      scheduleResume();
    }

    function onFocusIn() {
      focusingRef.current = true;
      clearResumeTimer();
      syncPaused();
    }

    function onFocusOut(event: FocusEvent) {
      if (scroller.contains(event.relatedTarget as Node | null)) return;
      focusingRef.current = false;
      scheduleResume();
    }

    function onPointerDown() {
      pointerDownRef.current = true;
      clearResumeTimer();
      syncPaused();
    }

    function onPointerUp() {
      pointerDownRef.current = false;
      recentInputRef.current = true;
      scheduleResume();
    }

    function onWheel() {
      recentInputRef.current = true;
      syncPaused();
      scheduleResume();
    }

    function onVisibility() {
      syncPaused();
      if (document.visibilityState === "visible" && !userStoppedRef.current && !reducedMotionRef.current) {
        scheduleResume();
      } else {
        clearResumeTimer();
      }
    }

    scroller.addEventListener("mouseenter", onMouseEnter);
    scroller.addEventListener("mouseleave", onMouseLeave);
    scroller.addEventListener("focusin", onFocusIn);
    scroller.addEventListener("focusout", onFocusOut);
    scroller.addEventListener("pointerdown", onPointerDown);
    scroller.addEventListener("pointerup", onPointerUp);
    scroller.addEventListener("pointercancel", onPointerUp);
    scroller.addEventListener("wheel", onWheel, { passive: true });
    scroller.addEventListener("scroll", wrapScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      clearResumeTimer();
      media.removeEventListener("change", onMediaChange);
      scroller.removeEventListener("mouseenter", onMouseEnter);
      scroller.removeEventListener("mouseleave", onMouseLeave);
      scroller.removeEventListener("focusin", onFocusIn);
      scroller.removeEventListener("focusout", onFocusOut);
      scroller.removeEventListener("pointerdown", onPointerDown);
      scroller.removeEventListener("pointerup", onPointerUp);
      scroller.removeEventListener("pointercancel", onPointerUp);
      scroller.removeEventListener("wheel", onWheel);
      scroller.removeEventListener("scroll", wrapScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="flex items-end justify-between gap-4 mb-4">
        <h2 className="font-display font-medium text-[22px] md:text-[26px] text-[#08343C]">
          Neighborhoods
        </h2>
        <div className="flex items-center gap-3 shrink-0">
          {!reducedMotion && (
            <button
              type="button"
              onClick={toggleAutoScroll}
              aria-label={userStopped ? "Resume auto-scroll" : "Pause auto-scroll"}
              className={`flex size-9 items-center justify-center rounded-full border border-[#DCE4E3] bg-white text-[#08343C] hover:border-[#0B5E6B] hover:text-[#0B5E6B] ${motion150} ${focusRing}`}
            >
              {userStopped ? (
                <Play className="ti-player-play" size={16} fill="currentColor" aria-hidden="true" />
              ) : (
                <Pause className="ti-player-pause" size={16} aria-hidden="true" />
              )}
            </button>
          )}
          <Link
            href="/neighborhoods"
            className="text-[14px] font-medium text-[#0B5E6B] hover:text-[#1B8B99]"
          >
            See all →
          </Link>
        </div>
      </div>

      <div
        ref={scrollerRef}
        role="region"
        aria-label="Neighborhoods"
        aria-live="off"
        className="-mx-6 px-6 overflow-x-auto"
      >
        <div ref={trackRef} className="flex w-max gap-4">
          {loopedNeighborhoods.map((name, index) => (
            <NeighborhoodCard
              key={`${name}-${index < neighborhoods.length ? "a" : "b"}`}
              name={name}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
