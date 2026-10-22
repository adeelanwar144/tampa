import { sectionForCategory } from "@/config/category-sections";
import type { PillarArticle } from "@/types";
import published from "./published-articles.json";

export const articles = (published as PillarArticle[]).map((article) => ({
  ...article,
  pillar: sectionForCategory(article.plannerCategory, article.pillar),
}));
