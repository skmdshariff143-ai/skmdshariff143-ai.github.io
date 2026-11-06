const REVEAL_SELECTOR =
  ".section-head, .project, .depth-grid, .more, .timeline li, .credential-list, .certificates, .about-grid > *, .contact-grid > *, .case-section";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function revealOnEntry(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("seen");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -6% 0px" },
  );

  document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((target) => {
    if (target.getBoundingClientRect().top < window.innerHeight) return;
    target.classList.add("reveal");
    observer.observe(target);
  });
}

export function initReveal(): void {
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) return;
  revealOnEntry();
}
