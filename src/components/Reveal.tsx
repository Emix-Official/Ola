import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export default function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Content stays visible if JS, observation, or animation isn't available.
    if (motion.matches || typeof IntersectionObserver === "undefined") return;
    if (element.getBoundingClientRect().top < window.innerHeight * 0.95) return;
    element.dataset.reveal = "waiting";
    function reveal() {
      if (element) element.dataset.reveal = "visible";
      observer.disconnect();
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal();
      },
      { threshold: 0, rootMargin: "0px 0px -24px 0px" },
    );
    observer.observe(element);
    motion.addEventListener("change", reveal);
    element.addEventListener("focusin", reveal);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", reveal);
      element.removeEventListener("focusin", reveal);
      element.removeAttribute("data-reveal");
    };
  }, []);

  return (
    <div ref={ref} className={`section-reveal ${className}`}>
      {children}
    </div>
  );
}
