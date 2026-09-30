"use client";

import { FormEvent, useState } from "react";

export function NewsletterBand() {
  const [email, setEmail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: wire to email provider
    console.log("newsletter subscribe", email);
  }

  return (
    <section className="w-full bg-[#F2F5F4]">
      <div className="mx-auto max-w-[560px] px-6 py-14 text-center">
        <h2 className="font-display font-medium text-[26px] md:text-[30px] text-[#08343C] leading-tight">
          Get Tampa sent to your inbox
        </h2>
        <p className="mt-2 text-[15px] text-[#4A626A]">
          New stories and neighborhood notes, a few times a month.
        </p>
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col sm:flex-row gap-2"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="h-11 flex-1 rounded-[var(--radius-btn)] border border-[#DCE4E3] bg-white px-3 text-sm text-[#08343C] placeholder:text-[#4A626A] focus:border-[#1B8B99] focus:outline-none focus:ring-4 focus:ring-[#0B5E6B]/10"
          />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-[var(--radius-btn)] bg-[#0B5E6B] px-5 text-sm font-semibold text-white hover:bg-[#08343C] transition-hover"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
