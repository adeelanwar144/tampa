import { isClearSky, isRainOrStorm } from "@/lib/weather";

export type WeatherTipKind = "rain" | "evening" | "hot" | "clear";

export type WeatherTipContext = {
  weatherCode: number;
  temperature: number;
  rainChance: number;
  hour: number;
};

export type WeatherTipRule = {
  id: WeatherTipKind;
  slug: string;
  text: string;
};

export const weatherTipRules: WeatherTipRule[] = [
  {
    id: "rain",
    slug: "things-to-do-in-tampa",
    text: "Rainy day? Try the Florida Aquarium",
  },
  {
    id: "clear",
    slug: "things-to-do-in-tampa",
    text: "Perfect weather for the Riverwalk",
  },
  {
    id: "hot",
    slug: "things-to-do-in-tampa",
    text: "Hot one! Cool off at Adventure Island",
  },
  {
    id: "evening",
    slug: "ybor-city-tampa-fl-33605",
    text: "Evening plans? Explore Ybor City",
  },
];

const MATCH_ORDER: WeatherTipKind[] = ["rain", "evening", "hot", "clear"];

export function tipMatches(kind: WeatherTipKind, ctx: WeatherTipContext): boolean {
  switch (kind) {
    case "rain":
      return isRainOrStorm(ctx.weatherCode) || ctx.rainChance > 50;
    case "evening":
      return ctx.hour >= 18;
    case "hot":
      return ctx.temperature > 90;
    case "clear":
      return isClearSky(ctx.weatherCode) && ctx.temperature < 90;
  }
}

export function pickWeatherTipKind(ctx: WeatherTipContext): WeatherTipKind | null {
  return MATCH_ORDER.find((kind) => tipMatches(kind, ctx)) ?? null;
}
