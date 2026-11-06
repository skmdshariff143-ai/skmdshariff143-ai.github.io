const FLIP_INTERVAL_MS = 2600;
const HALF_TURN_MS = 250;

export function initFlip(): void {
  const card = document.querySelector<HTMLElement>("[data-flip]");
  if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const words = (card.dataset.flip ?? "").split("|").filter(Boolean);
  if (words.length < 2) return;
  let index = 0;
  window.setInterval(() => {
    index = (index + 1) % words.length;
    card.classList.remove("turn");
    void card.offsetWidth;
    card.classList.add("turn");
    window.setTimeout(() => {
      card.textContent = words[index] ?? "";
    }, HALF_TURN_MS);
  }, FLIP_INTERVAL_MS);
}
