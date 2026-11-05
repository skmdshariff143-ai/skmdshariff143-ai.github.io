const REVEAL_SELECTOR =
  "h2, .section-lede, .project figure, .project-heading, .ledger > div, .settlement, table, .depth figure, .more, .about-grid > *, .contact > *, .case-body > *, .case-picture";
const DELAY_STEPS = 4;
const DELAY_STEP_MS = 70;

export function initReveal(): void {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("seen");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );

  document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((target, index) => {
    if (target.getBoundingClientRect().top < window.innerHeight) return;
    target.style.setProperty("--delay", `${(index % DELAY_STEPS) * DELAY_STEP_MS}ms`);
    target.classList.add("reveal");
    observer.observe(target);
  });
}
