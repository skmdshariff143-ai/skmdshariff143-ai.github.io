const SEEN_KEY = "intro-seen";

function hide(intro: HTMLElement): void {
  intro.classList.add("done");
}

export function initIntro(): void {
  const intro = document.querySelector<HTMLElement>("[data-intro]");
  if (!intro) return;
  try {
    if (sessionStorage.getItem(SEEN_KEY)) {
      intro.remove();
      return;
    }
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    hide(intro);
    return;
  }
  intro.querySelector("[data-intro-skip]")?.addEventListener("click", () => hide(intro));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hide(intro);
  });
  intro.addEventListener("animationend", (event) => {
    if (event.target === intro) intro.remove();
  });
}
