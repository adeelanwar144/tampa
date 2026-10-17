import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from "lucide-react";

export function WeatherIcon({
  code,
  isDay,
  className = "size-4",
}: {
  code: number;
  isDay: boolean;
  className?: string;
}) {
  const icon =
    code <= 1 ? (
      isDay ? <Sun className={className} /> : <Moon className={className} />
    ) : code === 2 ? (
      isDay ? <CloudSun className={className} /> : <CloudMoon className={className} />
    ) : code === 3 ? (
      <Cloud className={className} />
    ) : code === 45 || code === 48 ? (
      <CloudFog className={className} />
    ) : code >= 51 && code <= 57 ? (
      <CloudDrizzle className={className} />
    ) : (code >= 61 && code <= 67) || (code >= 80 && code <= 82) ? (
      <CloudRain className={className} />
    ) : (code >= 71 && code <= 77) || code === 85 || code === 86 ? (
      <CloudSnow className={className} />
    ) : code >= 95 ? (
      <CloudLightning className={className} />
    ) : (
      <Cloud className={className} />
    );

  return <span aria-hidden>{icon}</span>;
}

export function heroTintClass(code: number, isDay: boolean): string {
  if (!isDay) return "from-indigo-950/55";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) {
    return "from-blue-900/45";
  }
  if (code <= 1) return "from-amber-400/30";
  return "from-slate-400/30";
}

export function hourlyIsDay(time: string, sunrise: string | null, sunset: string | null): boolean {
  const stamp = time.slice(11, 16);
  if (sunrise && sunset) {
    return stamp >= sunrise.slice(11, 16) && stamp < sunset.slice(11, 16);
  }
  const hour = Number(time.slice(11, 13));
  return hour >= 6 && hour < 19;
}
