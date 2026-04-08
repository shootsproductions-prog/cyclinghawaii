import Image from "next/image";

export default function Footer() {
  return (
    <footer className="py-12 px-8 text-center border-t border-white/5">
      <Image
        src="/logo-white.png"
        alt="Cycling Hawaii"
        width={48}
        height={48}
        className="mx-auto mb-4 opacity-60"
      />
      <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg mb-2">
        CYCLING<span className="text-ocean-light">HAWAII</span>
      </div>
      <p className="text-sm text-ash">
        &copy; {new Date().getFullYear()} Cycling Hawaii. Ride with aloha.
      </p>
    </footer>
  );
}
