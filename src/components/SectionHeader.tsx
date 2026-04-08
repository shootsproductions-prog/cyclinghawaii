interface SectionHeaderProps {
  label: string;
  title: string;
  description: string;
}

export default function SectionHeader({
  label,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div className="text-center mb-14">
      <div className="text-[0.7rem] font-semibold tracking-[0.2em] uppercase text-brand mb-3">
        {label}
      </div>
      <h2 className="font-[family-name:var(--font-space-grotesk)] text-[clamp(1.75rem,4vw,2.75rem)] font-bold tracking-tight mb-3">
        {title}
      </h2>
      <p className="text-mist max-w-[520px] mx-auto text-base">{description}</p>
    </div>
  );
}
