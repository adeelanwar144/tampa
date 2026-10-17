export type HourlyForecast = {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
};

export type WeatherPayload = {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  label: string;
  feelsLike: number | null;
  humidity: number | null;
  windMph: number | null;
  uvIndex: number | null;
  sunrise: string | null;
  sunset: string | null;
  high: number | null;
  low: number | null;
  hourly: HourlyForecast[];
};

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    weather_code?: number;
    is_day?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: (number | null)[];
    weather_code?: (number | null)[];
    precipitation_probability?: (number | null)[];
  };
  daily?: {
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    sunrise?: string[];
    sunset?: string[];
    uv_index_max?: (number | null)[];
  };
};

export function weatherLabel(code: number, isDay: boolean): string {
  if (code === 0 || code === 1) return isDay ? "Sunny" : "Clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "Rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "Snow";
  if (code >= 95) return "Thunderstorm";
  return "Cloudy";
}

export function isRainOrStorm(code: number): boolean {
  return (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    code >= 95
  );
}

export function isClearSky(code: number): boolean {
  return code === 0 || code === 1;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function zonedHourKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}`;
}

function pickHourly(
  data: OpenMeteoResponse,
  timeZone: string,
  now: Date,
): HourlyForecast[] {
  const times = data.hourly?.time;
  const temps = data.hourly?.temperature_2m;
  const codes = data.hourly?.weather_code;
  const rain = data.hourly?.precipitation_probability;
  if (!times?.length || !temps || !codes || !rain) return [];

  const currentKey = zonedHourKey(now, timeZone);
  let start = times.findIndex((stamp) => stamp.slice(0, 13) >= currentKey);
  if (start < 0) return [];

  const hours: HourlyForecast[] = [];
  for (let i = start; i < times.length && hours.length < 5; i += 1) {
    const temperature = asNumber(temps[i]);
    const weatherCode = asNumber(codes[i]);
    const precipitationProbability = asNumber(rain[i]);
    const time = asString(times[i]);
    if (temperature === null || weatherCode === null || precipitationProbability === null || !time) {
      continue;
    }
    hours.push({
      time,
      temperature: Math.round(temperature),
      weatherCode,
      precipitationProbability: Math.round(precipitationProbability),
    });
  }
  return hours;
}

export function parseWeather(
  data: OpenMeteoResponse,
  timeZone: string,
  now = new Date(),
): WeatherPayload | null {
  const temperature = asNumber(data.current?.temperature_2m);
  const weatherCode = asNumber(data.current?.weather_code);
  const isDayRaw = asNumber(data.current?.is_day);
  if (temperature === null || weatherCode === null || isDayRaw === null) {
    return null;
  }

  const isDay = isDayRaw === 1;
  const feelsLike = asNumber(data.current?.apparent_temperature);
  const humidity = asNumber(data.current?.relative_humidity_2m);
  const windMph = asNumber(data.current?.wind_speed_10m);
  const high = asNumber(data.daily?.temperature_2m_max?.[0]);
  const low = asNumber(data.daily?.temperature_2m_min?.[0]);
  const uvIndex = asNumber(data.daily?.uv_index_max?.[0]);

  return {
    temperature: Math.round(temperature),
    weatherCode,
    isDay,
    label: weatherLabel(weatherCode, isDay),
    feelsLike: feelsLike === null ? null : Math.round(feelsLike),
    humidity: humidity === null ? null : Math.round(humidity),
    windMph: windMph === null ? null : Math.round(windMph),
    uvIndex: uvIndex === null ? null : Math.round(uvIndex),
    sunrise: asString(data.daily?.sunrise?.[0]),
    sunset: asString(data.daily?.sunset?.[0]),
    high: high === null ? null : Math.round(high),
    low: low === null ? null : Math.round(low),
    hourly: pickHourly(data, timeZone, now),
  };
}

export function openMeteoUrl(latitude: number, longitude: number, timeZone: string): string {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
  );
  url.searchParams.set("hourly", "temperature_2m,weather_code,precipitation_probability");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("wind_speed_unit", "mph");
  url.searchParams.set("timezone", timeZone);
  url.searchParams.set("forecast_days", "2");
  return url.toString();
}

export function isWeatherPayload(value: unknown): value is WeatherPayload {
  if (!value || typeof value !== "object") return false;
  const data = value as WeatherPayload;
  return (
    typeof data.temperature === "number" &&
    typeof data.weatherCode === "number" &&
    typeof data.isDay === "boolean" &&
    typeof data.label === "string" &&
    data.label.length > 0
  );
}
