import { NextRequest, NextResponse } from "next/server";
import { openMeteoUrl, parseWeather } from "@/lib/weather";

export const revalidate = 900;

const TIMEZONE_RE = /^[A-Za-z0-9_+\-/]+$/;

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));
  const timeZone = request.nextUrl.searchParams.get("timezone") ?? "America/New_York";

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return NextResponse.json({ error: "invalid latitude" }, { status: 400 });
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "invalid longitude" }, { status: 400 });
  }
  if (!TIMEZONE_RE.test(timeZone)) {
    return NextResponse.json({ error: "invalid timezone" }, { status: 400 });
  }

  try {
    const response = await fetch(openMeteoUrl(lat, lon, timeZone), {
      next: { revalidate: 900 },
    });
    if (!response.ok) {
      return NextResponse.json({ error: "upstream" }, { status: 502 });
    }
    const payload = parseWeather(await response.json(), timeZone);
    if (!payload) {
      return NextResponse.json({ error: "malformed" }, { status: 502 });
    }
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
