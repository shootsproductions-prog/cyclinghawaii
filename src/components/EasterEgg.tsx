"use client";

import { useEffect, useState } from "react";

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

export default function EasterEgg() {
  const [keys, setKeys] = useState<string[]>([]);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      setKeys((prev) => {
        const next = [...prev, e.key].slice(-10);
        if (next.join(",") === KONAMI.join(",")) {
          setTriggered(true);
          setTimeout(() => setTriggered(false), 5000);
        }
        return next;
      });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!triggered) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#000000]/80 animate-[fadeInUp_0.4s_ease-out]">
      <div className="text-center px-8">
        <div className="text-6xl mb-4">🤙</div>
        <p className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-white mb-2">
          Aloha, you found it!
        </p>
        <p className="text-white/70 text-lg">
          Vini&apos;s secret: he talks to his bike. The bike doesn&apos;t answer.
          <br />
          <span className="text-sm text-white/40">Yet.</span>
        </p>
      </div>
    </div>
  );
}
