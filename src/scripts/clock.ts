const CLOCK_REFRESH_MS = 30_000;

export function initClock(): void {
  const clock = document.querySelector<HTMLElement>("[data-clock]");
  if (!clock) return;
  const format = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const label = clock.dataset.clock ?? "";
  const tick = (): void => {
    clock.textContent = `${label} · ${format.format(new Date())}`;
  };
  tick();
  window.setInterval(tick, CLOCK_REFRESH_MS);
}
