// Small shared building blocks for the interactive tools (/fit and
// /coach). They follow the site's existing look: white cards with a
// hairline border, uppercase orange labels, pill buttons.

import type { ButtonHTMLAttributes, ReactNode } from "react";

export const display = "font-[family-name:var(--font-space-grotesk)]";

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`text-[0.7rem] font-semibold tracking-[0.2em] uppercase text-brand ${className}`}>
      {children}
    </div>
  );
}

export function Card({
  children,
  className = "",
  ...rest
}: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`bg-card border border-border rounded-xl p-5 md:p-6 ${className}`} {...rest}>
      {children}
    </div>
  );
}

type Variant = "primary" | "accent" | "ghost" | "quiet";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-text text-bg hover:opacity-90",
  accent: "bg-strava text-white hover:bg-strava/90",
  ghost: "bg-transparent text-text border border-border hover:border-text/40",
  quiet: "bg-surface text-text hover:bg-border/60",
};

/** Class string for pill buttons, for <label> and <a> elements that should look like one. */
export function buttonClass(variant: Variant = "primary", size: "sm" | "md" = "md"): string {
  const sizing = size === "sm" ? "px-3.5 py-2 text-xs" : "px-5 py-2.5 text-sm";
  return `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors cursor-pointer select-none min-h-[40px] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strava ${sizing} ${VARIANTS[variant]}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }) {
  return <button type={type} className={`${buttonClass(variant, size)} ${className}`} {...rest} />;
}

export type Tone = "good" | "warn" | "bad" | "neutral";

const TONES: Record<Tone, string> = {
  good: "bg-emerald-500/15 text-emerald-800",
  warn: "bg-amber-500/15 text-amber-800",
  bad: "bg-red-500/15 text-red-800",
  neutral: "bg-mist/15 text-mist",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-block whitespace-nowrap text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** A quiet callout. `tone` picks the left rule colour. */
export function Callout({
  tone = "neutral",
  title,
  children,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
}) {
  const rule =
    tone === "good"
      ? "border-l-emerald-600"
      : tone === "warn"
        ? "border-l-amber-500"
        : tone === "bad"
          ? "border-l-red-500"
          : "border-l-mist/40";
  return (
    <div className={`bg-surface border border-border border-l-4 ${rule} rounded-lg px-4 py-3 text-sm text-text/85 leading-relaxed`}>
      {title && <div className="font-semibold text-text mb-1">{title}</div>}
      {children}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 md:mb-10">
      <Eyebrow className="mb-2">{eyebrow}</Eyebrow>
      <h2 className={`${display} text-2xl md:text-3xl font-bold tracking-tight text-text`}>
        {title}
      </h2>
      {children && <p className="text-mist mt-2 max-w-[640px] leading-relaxed">{children}</p>}
    </div>
  );
}
