import { useRef, useEffect } from "react";

export function useScrollAnimation() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate");
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    const timelineSteps = element.querySelectorAll(".timeline-step");
    timelineSteps.forEach((step) => observer.observe(step));

    return () => {
      timelineSteps.forEach((step) => observer.unobserve(step));
    };
  }, []);

  return { ref };
}
