function setOpen(frame: HTMLElement, open: boolean): void {
  frame.classList.toggle("open", open);
  frame.querySelector<HTMLButtonElement>("[data-door]")?.setAttribute("aria-expanded", String(open));
  frame.querySelector<HTMLElement>("[data-door-room]")?.toggleAttribute("inert", !open);
}

export function initDoors(): void {
  const frames = document.querySelectorAll<HTMLElement>("[data-door-frame]");
  if (frames.length === 0) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  frames.forEach((frame) => {
    if (!reduceMotion) setOpen(frame, false);
    frame.querySelector<HTMLButtonElement>("[data-door]")?.addEventListener("click", () => {
      setOpen(frame, !frame.classList.contains("open"));
    });
  });
}
