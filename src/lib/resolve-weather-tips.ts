import { weatherTipRules, type WeatherTipKind } from "@/config/weather-tips";
import { articleHref, getPublishedArticles } from "@/lib/pillars";

export type ResolvedWeatherTip = {
  id: WeatherTipKind;
  href: string;
  text: string;
};

export function resolveWeatherTips(): ResolvedWeatherTip[] {
  const published = getPublishedArticles();
  return weatherTipRules.flatMap((rule) => {
    const article = published.find((item) => item.slug === rule.slug);
    if (!article) return [];
    return [{ id: rule.id, href: articleHref(article), text: rule.text }];
  });
}
