import { useRef, useEffect, useCallback } from "react";

export function useParallax(speed: number = 0.5) {
  const ref = useRef<HTMLElement>(null);
  const rafId = useRef<number>();

  const handleScroll = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    rafId.current = requestAnimationFrame(() => {
      const element = ref.current;
      if (!element) return;

      const scrolled = window.pageYOffset;
      const yPos = -(scrolled * speed);
      
      const parallaxElements = element.querySelectorAll(".parallax-element");
      parallaxElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.willChange = "transform";
        htmlEl.style.transform = `translateY(${yPos}px)`;
      });
    });
  }, [speed]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [handleScroll]);

  return { ref };
}
