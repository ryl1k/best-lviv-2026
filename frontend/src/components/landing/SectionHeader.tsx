interface SectionHeaderProps {
  eyebrow: string;
  titleStart: string;
  titleEmphasis: string;
  titleEnd: string;
  description?: string;
}

export function SectionHeader({
  eyebrow,
  titleStart,
  titleEmphasis,
  titleEnd,
  description,
}: SectionHeaderProps) {
  return (
    <div className="grid gap-8 border-b border-landing-border pb-16 md:grid-cols-12">
      <div className="md:col-span-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-landing-signal">{eyebrow}</p>
      </div>
      <div className="md:col-span-9">
        <h2 className="font-landing-display text-5xl leading-[1.02] tracking-[-0.02em] text-landing-ink md:text-7xl">
          {titleStart} <em className="italic text-landing-ink-soft">{titleEmphasis}</em> {titleEnd}
        </h2>
        {description ? (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-landing-ink-soft">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
