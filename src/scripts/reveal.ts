const REVEAL_SELECTOR =
  "h2, .section-lede, .proof > div, .project-heading, .project-body > *, .ledger > div, table, .depth figure, .more, .about-grid > *, .contact > *, .case-body > *, .case-picture";
const DELAY_STEPS = 4;
const DELAY_STEP_MS = 80;
const SMALLEST_GROW_SCALE = 0.92;

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
    { rootMargin: "0px 0px -8% 0px" },
  );

  document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((target, index) => {
    if (target.getBoundingClientRect().top < window.innerHeight) return;
    target.style.setProperty("--delay", `${(index % DELAY_STEPS) * DELAY_STEP_MS}ms`);
    target.classList.add("reveal");
    observer.observe(target);
  });
}

function growHeroOnScroll(): void {
  const frame = document.querySelector<HTMLElement>("[data-scroll-grow]");
  const image = frame?.querySelector("img");
  if (!frame || !image) return;

  let waiting = false;
  const update = (): void => {
    waiting = false;
    const distance = frame.getBoundingClientRect().top;
    const progress = Math.min(Math.max(1 - distance / window.innerHeight, 0), 1);
    const scale = SMALLEST_GROW_SCALE + (1 - SMALLEST_GROW_SCALE) * progress;
    image.style.transform = `scale(${scale.toFixed(4)})`;
  };
  update();
  window.addEventListener(
    "scroll",
    () => {
      if (waiting) return;
      waiting = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
}

export function initReveal(): void {
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) return;
  revealOnEntry();
  growHeroOnScroll();
}
