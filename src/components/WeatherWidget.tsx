"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Droplets,
  MapPin,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
} from "lucide-react";
import { pickWeatherTipKind } from "@/config/weather-tips";
import type { ResolvedWeatherTip } from "@/lib/resolve-weather-tips";
import { MOBILE_MENU_EVENT } from "@/lib/mobile-menu";
import { isWeatherPayload, type WeatherPayload } from "@/lib/weather";
import { WeatherIcon, heroTintClass, hourlyIsDay } from "@/components/weather/WeatherIcon";
import { focusRing } from "@/components/layout/nav";

export type WeatherWidgetProps = {
  city: string;
  region?: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  tips?: ResolvedWeatherTip[];
};

const WEATHER_REFRESH_MS = 15 * 60 * 1000;
const STORAGE_KEY = "tampa-weather-widget-expanded";
const GLASS =
  "bg-[rgba(10,25,60,0.75)] backdrop-blur-[12px] border border-white/15 text-white shadow-[0_10px_40px_rgba(0,0,0,0.28)]";
const DARK_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A193C]";

function readExpanded(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeExpanded(expanded: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, expanded ? "1" : "0");
  } catch {
    /* ignore quota / private mode */
  }
}

function msUntilNextMinute() {
  return 60_000 - (Date.now() % 60_000);
}

function formatClock(now: Date, timeZone: string) {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
    }).formatToParts(now).find((part) => part.type === "hour")?.value ?? "0",
  );
  return { time, date, hour };
}

function formatHour12(hour: number, minute?: number) {
  if (!Number.isFinite(hour)) return null;
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  if (minute === undefined) return `${hour12} ${suffix}`;
  if (!Number.isFinite(minute)) return null;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function formatHourLabel(stamp: string) {
  return formatHour12(Number(stamp.slice(11, 13))) ?? "";
}

function formatSunTime(stamp: string) {
  return formatHour12(Number(stamp.slice(11, 13)), Number(stamp.slice(14, 16)));
}

function useLocalClock(timeZone: string) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    let intervalId = 0;
    const timeoutId = window.setTimeout(() => {
      setNow(new Date());
      intervalId = window.setInterval(() => setNow(new Date()), 60_000);
    }, msUntilNextMinute());
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [timeZone]);

  return now;
}

function useWeather(latitude: number, longitude: number, timeZone: string) {
  const [weather, setWeather] = useState<WeatherPayload | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const params = new URLSearchParams({
          lat: String(latitude),
          lon: String(longitude),
          timezone: timeZone,
        });
        const response = await fetch(`/api/weather?${params}`);
        if (!response.ok) throw new Error("weather");
        const data: unknown = await response.json();
        if (!isWeatherPayload(data)) throw new Error("weather");
        if (!cancelled) {
          setWeather({
            ...data,
            isDay: Boolean(data.isDay),
            hourly: Array.isArray(data.hourly) ? data.hourly : [],
          });
        }
      } catch {
        if (!cancelled) setWeather(null);
      }
    };
    void load();
    const interval = window.setInterval(load, WEATHER_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [latitude, longitude, timeZone]);

  return weather;
}

export function WeatherWidget({
  city,
  region,
  latitude,
  longitude,
  timeZone,
  tips = [],
}: WeatherWidgetProps) {
  const panelId = useId();
  const pillRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const now = useLocalClock(timeZone);
  const weather = useWeather(latitude, longitude, timeZone);
  const clock = now ? formatClock(now, timeZone) : null;
  const locationLabel = region ? `${city}, ${region}` : city;

  useEffect(() => {
    setExpanded(readExpanded());
    setReady(true);
    const id = window.setTimeout(() => setEntered(true), 800);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const onMenu = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      setMenuOpen(Boolean(detail?.open));
    };
    window.addEventListener(MOBILE_MENU_EVENT, onMenu);
    return () => window.removeEventListener(MOBILE_MENU_EVENT, onMenu);
  }, []);

  const close = useCallback(() => {
    setExpanded(false);
    writeExpanded(false);
    setDragY(0);
  }, []);

  const open = useCallback(() => {
    setExpanded(true);
    writeExpanded(true);
  }, []);

  useEffect(() => {
    if (!expanded || !entered) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = panelRef.current;
    const focusables = () =>
      root
        ? [...root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")].filter(
            (el) => !el.hasAttribute("disabled"),
          )
        : [];
    const items = focusables();
    (items[0] ?? root)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      if (previous && previous !== document.body) previous.focus();
    };
  }, [expanded, entered, close]);

  const rainChance = weather?.hourly?.length
    ? Math.max(0, ...weather.hourly.map((hour) => hour.precipitationProbability))
    : 0;
  const tipKind =
    weather && clock
      ? pickWeatherTipKind({
          weatherCode: weather.weatherCode,
          temperature: weather.temperature,
          rainChance,
          hour: clock.hour,
        })
      : null;
  const tip = tipKind ? (tips.find((item) => item.id === tipKind) ?? null) : null;

  const hidden = menuOpen;
  const enterClass = entered
    ? "translate-x-0 opacity-100"
    : "translate-x-full opacity-0 motion-reduce:translate-x-0";

  const onHandlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onHandlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;
    setDragY(Math.max(0, event.clientY - dragStartY.current));
  };
  const onHandlePointerUp = () => {
    if (dragY > 80) close();
    else setDragY(0);
    dragStartY.current = null;
  };

  if (!ready) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-40 ${hidden ? "invisible" : ""}`}
      aria-hidden={hidden}
    >
      <button
          ref={pillRef}
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-hidden={expanded}
          tabIndex={expanded ? -1 : 0}
          aria-label={`Current time and weather in ${city}`}
          onClick={open}
          className={`${expanded ? "invisible pointer-events-none" : "pointer-events-auto"} absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] flex h-11 max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full px-3.5 text-[13px] md:top-[120px] md:bottom-auto ${GLASS} ${DARK_FOCUS} ${enterClass} motion-safe:transition-[transform,opacity,border-color,box-shadow] motion-safe:duration-[400ms] motion-safe:ease-out hover:-translate-y-0.5 hover:border-white/40`}
        >
          {weather === undefined ? (
            <span className="inline-block h-3.5 w-14 shrink-0 rounded-sm bg-white/20" aria-hidden />
          ) : weather ? (
            <>
              <WeatherIcon code={weather.weatherCode} isDay={weather.isDay} className="size-4 shrink-0" />
              <span className="min-w-[3.5ch] font-medium tabular-nums">{weather.temperature}°F</span>
            </>
          ) : null}
          <span className="inline-block min-w-[7.5ch] font-medium tabular-nums">
            {clock?.time ?? "\u00a0"}
          </span>
        </button>

      {expanded && (
        <>
          {entered && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Close weather"
              className="pointer-events-auto absolute inset-0 bg-black/25"
              onClick={close}
            />
          )}
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${panelId}-title`}
            tabIndex={-1}
            style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
            className={`pointer-events-auto absolute inset-x-0 bottom-0 flex max-h-[min(85vh,640px)] w-full flex-col overflow-y-auto rounded-t-[20px] p-6 md:inset-x-auto md:top-[120px] md:right-4 md:bottom-auto md:max-h-[min(80vh,640px)] md:w-[320px] md:max-w-[calc(100vw-2rem)] md:rounded-[20px] ${GLASS} ${enterClass} motion-safe:transition-[transform,opacity] motion-safe:duration-[400ms] motion-safe:ease-out ${DARK_FOCUS}`}
          >
            <div
              className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-white/30 md:hidden"
              onPointerDown={onHandlePointerDown}
              onPointerMove={onHandlePointerMove}
              onPointerUp={onHandlePointerUp}
              onPointerCancel={onHandlePointerUp}
              style={{ touchAction: "none" }}
              aria-hidden
            />

            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-1.5">
                <MapPin className="size-4 shrink-0 text-white/80" aria-hidden />
                <h2 id={`${panelId}-title`} className="truncate text-[15px] font-semibold">
                  {locationLabel}
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white ${DARK_FOCUS}`}
                aria-label="Minimize weather"
              >
                <ChevronDown className="size-5 md:hidden" />
                <ChevronRight className="hidden size-5 md:block" />
              </button>
            </div>

            <p className="mt-4 font-display text-[36px] leading-none font-light tracking-tight tabular-nums md:text-[40px]">
              {clock?.time ?? "\u00a0"}
            </p>
            <p className="mt-1.5 min-h-[1.25rem] text-[13px] text-white/80">{clock?.date ?? ""}</p>

            {weather === undefined ? (
              <div className="mt-6 h-16 w-full rounded-xl bg-white/10" aria-hidden />
            ) : weather ? (
              <>
                <div
                  className={`relative mt-5 overflow-hidden rounded-xl bg-gradient-to-br to-transparent p-3 ${heroTintClass(weather.weatherCode, weather.isDay)}`}
                >
                  <div className="flex items-center gap-3">
                    <WeatherIcon
                      code={weather.weatherCode}
                      isDay={weather.isDay}
                      className="size-12 shrink-0"
                    />
                    <div>
                      <p className="text-[44px] leading-none font-bold tabular-nums">
                        {weather.temperature}°
                      </p>
                      <p className="mt-1 text-[13px] text-white/85">{weather.label}</p>
                    </div>
                  </div>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-x-3 gap-y-3 text-[13px]">
                  {typeof weather.feelsLike === "number" && (
                    <Detail icon={<Thermometer className="size-3.5" />} label="Feels like" value={`${weather.feelsLike}°F`} />
                  )}
                  {typeof weather.humidity === "number" && (
                    <Detail icon={<Droplets className="size-3.5" />} label="Humidity" value={`${weather.humidity}%`} />
                  )}
                  {typeof weather.windMph === "number" && (
                    <Detail icon={<Wind className="size-3.5" />} label="Wind" value={`${weather.windMph} mph`} />
                  )}
                  {typeof weather.uvIndex === "number" && (
                    <Detail icon={<Sun className="size-3.5" />} label="UV index" value={String(weather.uvIndex)} />
                  )}
                  {weather.sunrise && formatSunTime(weather.sunrise) && (
                    <Detail
                      icon={<Sunrise className="size-3.5" />}
                      label="Sunrise"
                      value={formatSunTime(weather.sunrise) ?? ""}
                    />
                  )}
                  {weather.sunset && formatSunTime(weather.sunset) && (
                    <Detail
                      icon={<Sunset className="size-3.5" />}
                      label="Sunset"
                      value={formatSunTime(weather.sunset) ?? ""}
                    />
                  )}
                </dl>

                {weather.hourly.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2 text-[11px] font-medium tracking-wide text-white/70 uppercase">
                      Next hours
                    </p>
                    <ul className="grid grid-cols-5 gap-1">
                      {weather.hourly.map((hour) => {
                        const label = formatHourLabel(hour.time);
                        if (!label) return null;
                        return (
                          <li key={hour.time} className="flex flex-col items-center gap-1 rounded-lg py-1 text-center">
                            <span className="text-[11px] text-white/75">{label}</span>
                            <WeatherIcon
                              code={hour.weatherCode}
                              isDay={hourlyIsDay(hour.time, weather.sunrise, weather.sunset)}
                              className="size-4"
                            />
                            <span className="text-[12px] font-medium tabular-nums">{hour.temperature}°</span>
                            {hour.precipitationProbability > 20 ? (
                              <span className="text-[10px] text-sky-200 tabular-nums">
                                {hour.precipitationProbability}%
                              </span>
                            ) : (
                              <span className="h-[14px]" aria-hidden />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {tip && (
                  <Link
                    href={tip.href}
                    className={`mt-5 block rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-[13px] font-medium text-white hover:bg-white/15 ${focusRing}`}
                  >
                    {tip.text}
                  </Link>
                )}
              </>
            ) : (
              <p className="mt-6 text-[13px] text-white/80">Weather unavailable right now</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-white/70" aria-hidden>
        {icon}
      </span>
      <div>
        <dt className="text-[11px] text-white/70">{label}</dt>
        <dd className="font-medium tabular-nums">{value}</dd>
      </div>
    </div>
  );
}
