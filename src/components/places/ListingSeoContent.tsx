import type { ListingFaqItem } from "@/lib/listing-content";

export function ListingSeoBody({ html }: { html: string }) {
  return (
    <article
      className="listing-seo-content mb-8 space-y-4 text-base leading-relaxed text-ink-600 [&_h2]:font-display [&_h2]:font-700 [&_h2]:text-[22px] [&_h2]:leading-tight [&_h2]:text-gulf-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:max-w-[68ch] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-gulf-700"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function ListingFaq({ items }: { items: ListingFaqItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="font-display font-700 text-[22px] text-gulf-900 mb-3">Frequently asked questions</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <details
            key={item.q}
            className="rounded-[var(--radius-card)] border border-line bg-white px-4 py-3"
          >
            <summary className="cursor-pointer font-display font-700 text-gulf-900">
              {item.q}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
