import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+?\*\*|\*[^*]+?\*|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("![")) {
      const image = token.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (image) {
        nodes.push(
          // eslint-disable-next-line @next/next/no-img-element
          <img key={key} src={image[2]} alt={image[1]} className="w-full rounded-[10px]" />,
        );
      }
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        const href = link[2];
        const external = /^https?:\/\//i.test(href);
        let booking = false;
        if (external) {
          try {
            booking = /(^|\.)booking\.com$/i.test(new URL(href).hostname);
          } catch {
            booking = /booking\.com/i.test(href);
          }
        }
        nodes.push(
          <a
            key={key}
            href={href}
            className="text-gulf-700 underline underline-offset-2 hover:text-gulf-500"
            {...(external
              ? {
                  target: "_blank",
                  rel: booking ? "sponsored nofollow noopener" : "noopener",
                }
              : {})}
          >
            {link[1]}
          </a>,
        );
      }
    }
    key += 1;
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function isImageLine(line: string): boolean {
  return /^!\[[^\]]*\]\([^)]+\)$/.test(line.trim());
}

function headingLevel(line: string): { level: number; text: string } | null {
  const match = line.match(/^(#{1,3})\s+(.+)$/);
  if (!match) return null;
  return { level: match[1].length, text: match[2].trim() };
}

function extractFaqs(markdown: string): { question: string; answer: string }[] {
  const match = markdown.match(/^##\s+.*faq.*$/im);
  if (!match || match.index == null) return [];
  const rest = markdown.slice(match.index);
  const next = rest.slice(match[0].length).search(/^##\s+/m);
  const section = next === -1 ? rest : rest.slice(0, match[0].length + next);
  const parts = [...section.matchAll(/^###\s+(.+\?)\s*\n+([\s\S]*?)(?=^###\s+|\s*$)/gm)];
  return parts.map((part) => ({
    question: part[1].trim(),
    answer: part[2].trim().replace(/\s+/g, " "),
  }));
}

export function faqJsonLd(markdown: string) {
  const faqs = extractFaqs(markdown);
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function ArticleMarkdown({ markdown }: { markdown: string }) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let skippedTitle = false;
  let skippedHero = false;
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      i += 1;
      continue;
    }

    const heading = headingLevel(trimmed);
    if (heading) {
      if (heading.level === 1 && !skippedTitle) {
        skippedTitle = true;
        i += 1;
        continue;
      }
      const Tag = (heading.level === 2 ? "h2" : "h3") as "h2" | "h3";
      const className =
        heading.level === 2
          ? "font-display font-700 text-[26px] leading-tight text-gulf-900 mt-10 mb-3"
          : "font-display font-700 text-[20px] leading-snug text-gulf-900 mt-8 mb-2";
      blocks.push(
        <Tag key={key} className={className}>
          {renderInline(heading.text)}
        </Tag>,
      );
      key += 1;
      i += 1;
      continue;
    }

    if (isImageLine(trimmed)) {
      const caption = lines[i + 1]?.trim().startsWith("*") && !isImageLine(lines[i + 1]?.trim() ?? "")
        ? lines[i + 1].trim()
        : "";
      if (!skippedHero) {
        skippedHero = true;
        i += caption ? 2 : 1;
        continue;
      }
      const image = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      blocks.push(
        <figure key={key} className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image?.[2]} alt={image?.[1] ?? ""} className="w-full rounded-[10px]" />
          {caption ? (
            <figcaption className="mt-2 text-sm text-ink-600">{renderInline(caption)}</figcaption>
          ) : null}
        </figure>,
      );
      key += 1;
      i += caption ? 2 : 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={key} className="list-disc pl-6 mb-4 space-y-2 text-[17px] leading-relaxed text-ink-600">
          {items.map((item, index) => (
            <li key={index}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      key += 1;
      continue;
    }

    const para: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (!next || headingLevel(next) || isImageLine(next) || /^[-*]\s+/.test(next)) break;
      para.push(next);
      i += 1;
    }
    blocks.push(
      <p key={key} className="text-[17px] leading-relaxed text-ink-600 mb-4">
        {renderInline(para.join(" "))}
      </p>,
    );
    key += 1;
  }

  return <div className="article-body">{blocks}</div>;
}
