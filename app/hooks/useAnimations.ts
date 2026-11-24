"use client";

import { useEffect, useState } from "react";

export function useCountdown(initialMs: number) {
  const [ms, setMs] = useState(initialMs);
  useEffect(() => {
    const id = setInterval(() => setMs((prev) => Math.max(0, prev - 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function useScrollAnimate() {
  useEffect(() => {
    const els = document.querySelectorAll(".animate-in");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const siblings = [...(entry.target.parentElement?.children ?? [])];
            const idx = siblings.indexOf(entry.target as Element);
            (entry.target as HTMLElement).style.transitionDelay = `${idx * 80}ms`;
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}
