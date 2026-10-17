import { loadPlanner } from "./planner";

const rows = loadPlanner("C:/Users/adeel/Downloads/Tampa_Content_Plan_Keyword_Clusters.xlsx");
const hits = rows.filter((row) =>
  row.primaryKeyword.toLowerCase().includes("free things") ||
  row.lsiKeywords.some((kw) => kw.toLowerCase().includes("free things to do")),
);
const seen = new Set<string>();
for (const row of hits) {
  if (seen.has(row.slug)) continue;
  seen.add(row.slug);
  console.log(`${row.slug}\t${row.primaryKeyword}\t${row.lsiKeywords.slice(0, 8).join(" | ")}`);
}
console.log(`\nmatches: ${seen.size}`);
const freeSlugs = [...new Set(rows.filter((row) => row.slug.includes("free")).map((row) => `${row.slug} | ${row.primaryKeyword}`))];
console.log("\nslugs containing free:");
for (const line of freeSlugs) console.log(line);
