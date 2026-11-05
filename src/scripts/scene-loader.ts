const LOW_MEMORY_GB = 2;
const MINIMUM_CORES = 4;
const START_WITHOUT_INPUT_MS = 6000;
const FIRST_INPUTS = ["pointermove", "pointerdown", "scroll", "keydown"] as const;

interface NavigatorHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

function canRunScene(): boolean {
  const hints = navigator as NavigatorHints;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (hints.connection?.saveData) return false;
  if (hints.deviceMemory !== undefined && hints.deviceMemory <= LOW_MEMORY_GB) return false;
  if (navigator.hardwareConcurrency < MINIMUM_CORES) return false;
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

function readStages() {
  return [...document.querySelectorAll<HTMLElement>("[data-stage-image]")].map((element) => ({
    element,
    imageUrl: `/images/${element.dataset["stageImage"]}-1440.webp`,
    imageAspect: Number(element.dataset["stageAspect"]),
    color: element.dataset["stageColor"] ?? "#0a0c0b",
  }));
}

async function startScene(canvas: HTMLCanvasElement, hero: HTMLElement): Promise<void> {
  try {
    const { createPortfolioScene } = await import("../scene/portfolioScene");
    createPortfolioScene(canvas, hero, readStages(), () => {
      document.documentElement.classList.add("has-3d");
      canvas.dataset["scene"] = "ready";
    });
  } catch {
    canvas.dataset["scene"] = "failed";
  }
}

export function initSceneWhenIdle(): void {
  const canvas = document.querySelector<HTMLCanvasElement>("[data-scene]");
  const hero = document.querySelector<HTMLElement>(".hero");
  if (!canvas || !hero) return;
  if (!canRunScene()) {
    canvas.dataset["scene"] = "off";
    return;
  }
  let started = false;
  const begin = (): void => {
    if (started) return;
    started = true;
    FIRST_INPUTS.forEach((type) => window.removeEventListener(type, begin));
    void startScene(canvas, hero);
  };
  FIRST_INPUTS.forEach((type) => window.addEventListener(type, begin, { passive: true }));
  window.setTimeout(begin, START_WITHOUT_INPUT_MS);
}
