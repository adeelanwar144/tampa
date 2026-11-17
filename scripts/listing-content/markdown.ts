import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

marked.setOptions({ gfm: true, breaks: false });

export function markdownToHtml(markdown: string): string {
  const html = marked.parse(markdown, { async: false }) as string;
  return sanitizeHtml(html, {
    allowedTags: ["p", "h2", "ul", "ol", "li", "strong", "em", "a", "br"],
    allowedAttributes: { a: ["href", "rel", "target"] },
    transformTags: {
      h1: "p",
      h3: "p",
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const external = /^https?:/i.test(href);
        return {
          tagName,
          attribs: external
            ? { href, rel: "noopener noreferrer", target: "_blank" }
            : { href },
        };
      },
    },
  });
}
