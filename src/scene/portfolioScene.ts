import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Points,
  PointsMaterial,
  Scene,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  TextureLoader,
  TorusGeometry,
  Vector2,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const NIGHT = "#0a0c0b";
const CAMERA_DISTANCE = 7;
const CAMERA_FOV = 35;
const NARROW_ASPECT = 0.9;
const MAX_PIXEL_RATIO = 1.75;
const WIDE_PARTICLES = 1600;
const NARROW_PARTICLES = 500;
const SETTLE_SPEED = 0.06;
const SLOW_FRAME_MS = 45;
const FRAMES_TO_SAMPLE = 90;

const RINGS = [
  { radius: 1.72, tube: 0.052, color: "#f1ece1", rotation: [1.1, 0.35, 0.2], markerStart: 2.4 },
  { radius: 1.34, tube: 0.052, color: "#ff5a26", rotation: [-0.7, 0.95, 0.5], markerStart: 4.6 },
  { radius: 0.96, tube: 0.052, color: "#4f6cf0", rotation: [0.4, -1.1, 1.0], markerStart: 0.9 },
] as const;

export interface StageDefinition {
  element: HTMLElement;
  imageUrl: string;
  imageAspect: number;
  color: string;
}

interface Ring {
  holder: Group;
  orbit: Group;
  baseRotation: readonly number[];
  markerStart: number;
}

interface Screen {
  mesh: Mesh;
  stage: StageDefinition;
}

function viewportWidthAtOrigin(aspect: number): number {
  const height = 2 * CAMERA_DISTANCE * Math.tan(MathUtils.degToRad(CAMERA_FOV / 2));
  return height * aspect;
}

function createGlowTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (context) {
    const glow = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, 64, 64);
  }
  return new CanvasTexture(canvas);
}

function createRing(definition: (typeof RINGS)[number], glowTexture: CanvasTexture): Ring {
  const holder = new Group();
  const hoop = new Mesh(
    new TorusGeometry(definition.radius, definition.tube, 24, 160),
    new MeshStandardMaterial({ color: definition.color, metalness: 1, roughness: 0.2 }),
  );
  holder.add(hoop);

  const orbit = new Group();
  const glow = new Sprite(
    new SpriteMaterial({ map: glowTexture, color: definition.color, blending: AdditiveBlending, depthWrite: false }),
  );
  glow.scale.setScalar(0.55);
  glow.position.x = definition.radius;
  orbit.add(glow);
  holder.add(orbit);

  return { holder, orbit, baseRotation: definition.rotation, markerStart: definition.markerStart };
}

function createParticles(count: number): Points {
  const positions: number[] = [];
  for (let index = 0; index < count; index += 1) {
    positions.push(
      MathUtils.randFloatSpread(16),
      MathUtils.randFloatSpread(10),
      MathUtils.randFloat(-9, 3),
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return new Points(
    geometry,
    new PointsMaterial({ color: "#f1ece1", size: 0.018, transparent: true, opacity: 0.7, depthWrite: false }),
  );
}

function stageProgress(element: HTMLElement): number {
  const box = element.getBoundingClientRect();
  return MathUtils.clamp((window.innerHeight - box.top) / (box.height + window.innerHeight), 0, 1);
}

function isCentred(element: HTMLElement): boolean {
  const box = element.getBoundingClientRect();
  const middle = window.innerHeight / 2;
  return box.top < middle && box.bottom > middle;
}

function isOnScreen(element: HTMLElement): boolean {
  const box = element.getBoundingClientRect();
  return box.bottom > 0 && box.top < window.innerHeight;
}

export function createPortfolioScene(
  canvas: HTMLCanvasElement,
  hero: HTMLElement,
  stages: StageDefinition[],
  onFirstFrame: () => void,
): void {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));

  const scene = new Scene();
  const environment = new PMREMGenerator(renderer);
  scene.environment = environment.fromScene(new RoomEnvironment(), 0.04).texture;
  environment.dispose();

  const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 40);
  camera.position.z = CAMERA_DISTANCE;

  const glowTexture = createGlowTexture();
  const ringGroup = new Group();
  const rings = RINGS.map((definition) => createRing(definition, glowTexture));
  rings.forEach((ring) => ringGroup.add(ring.holder));
  scene.add(ringGroup);

  const isNarrowStart = window.innerWidth / window.innerHeight < NARROW_ASPECT;
  const particles = createParticles(isNarrowStart ? NARROW_PARTICLES : WIDE_PARTICLES);
  scene.add(particles);

  const loader = new TextureLoader();
  const edge = new MeshBasicMaterial({ color: "#050606" });
  const screens: Screen[] = stages.map((stage) => {
    const texture = loader.load(stage.imageUrl);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const face = new MeshBasicMaterial({ map: texture, toneMapped: false });
    const mesh = new Mesh(new BoxGeometry(1, 1 / stage.imageAspect, 0.012), [edge, edge, edge, edge, face, edge]);
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, stage };
  });

  const pointerTarget = new Vector2();
  const pointer = new Vector2();
  window.addEventListener(
    "pointermove",
    (event) => {
      pointerTarget.set(event.clientX / window.innerWidth - 0.5, event.clientY / window.innerHeight - 0.5);
    },
    { passive: true },
  );

  const resize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize, { passive: true });

  const nightColor = new Color(NIGHT);
  const clearColor = new Color(NIGHT);
  const targetColor = new Color(NIGHT);
  const stageColors = stages.map((stage) => new Color(stage.color));
  let clock = 0;
  let announced = false;
  let sampledFrames = 0;
  let sampleStart = 0;

  const lightenIfSlow = (now: number): void => {
    if (sampledFrames > FRAMES_TO_SAMPLE) return;
    if (sampledFrames === 0) sampleStart = now;
    sampledFrames += 1;
    if (sampledFrames <= FRAMES_TO_SAMPLE) return;
    if ((now - sampleStart) / FRAMES_TO_SAMPLE < SLOW_FRAME_MS) return;
    renderer.setPixelRatio(1);
    particles.visible = false;
    resize();
  };

  const placeRings = (heroProgress: number, isNarrow: boolean, width: number): void => {
    const align = MathUtils.smoothstep(heroProgress, 0.02, 0.62);
    const heroScale = isNarrow ? Math.min(width / 4.1, 0.62) : 0.6;
    const heroX = isNarrow ? 0 : width * 0.31;
    const heroY = isNarrow ? 0.98 : 0.98;
    ringGroup.position.set(heroX, heroY + heroProgress * 0.45, 0);
    ringGroup.scale.setScalar(heroScale);
    ringGroup.rotation.y = clock * 0.05 * (1 - align);

    rings.forEach((ring, index) => {
      const swing = (1 - align) * clock * 0.17 * (index % 2 === 0 ? 1 : -1);
      ring.holder.rotation.set(
        (ring.baseRotation[0] ?? 0) * (1 - align) + swing * 0.5,
        (ring.baseRotation[1] ?? 0) * (1 - align) + swing,
        (ring.baseRotation[2] ?? 0) * (1 - align),
      );
      ring.orbit.rotation.z = MathUtils.lerp(ring.markerStart + clock * 0.35, Math.PI / 2, align);
    });
  };

  const frameScreen = (mesh: Mesh, size: number): void => {
    ringGroup.visible = true;
    ringGroup.position.set(mesh.position.x, mesh.position.y, mesh.position.z - 1.6);
    ringGroup.scale.setScalar(size * 0.245);
    ringGroup.rotation.set(0.3 + Math.sin(clock * 0.4) * 0.08, -0.2 + Math.sin(clock * 0.3) * 0.1, 0);
    rings.forEach((ring, index) => {
      ring.holder.rotation.set(0, 0, clock * 0.2 * (index + 1));
      ring.orbit.rotation.z = clock * 0.4 * (index + 1);
    });
  };

  const placeScreen = ({ mesh, stage }: Screen, isNarrow: boolean, width: number): void => {
    mesh.visible = isOnScreen(stage.element);
    if (!mesh.visible) return;

    const progress = stageProgress(stage.element);
    const enter = MathUtils.smoothstep(progress, 0.04, 0.42);
    const leave = MathUtils.smoothstep(progress, 0.72, 1);
    const size = isNarrow ? width * 0.92 : Math.min(width * 0.6, 5.2);
    const restX = isNarrow ? 0 : width / 2 - size / 2 - width * 0.03;
    const restY = isNarrow ? 0.72 : 0.12;

    mesh.scale.setScalar(size);
    mesh.position.set(
      restX + (1 - enter) * width * 0.55 - leave * width * 0.22,
      restY + (1 - enter) * -0.9 + leave * 1.7,
      (1 - enter) * -6 - leave * 2.5,
    );
    mesh.rotation.set(
      (1 - enter) * 0.5 - leave * 0.35,
      (1 - enter) * -1.05 + (isNarrow ? -0.12 : -0.2) + leave * 0.5,
      (1 - enter) * 0.12,
    );
    if (isCentred(stage.element)) frameScreen(mesh, size);
  };

  const render = (now: number): void => {
    requestAnimationFrame(render);
    const heroVisible = isOnScreen(hero);
    const anyStageVisible = stages.some((stage) => isOnScreen(stage.element));
    if (!heroVisible && !anyStageVisible && announced) return;

    clock += 1 / 60;
    const aspect = window.innerWidth / window.innerHeight;
    const isNarrow = aspect < NARROW_ASPECT;
    const width = viewportWidthAtOrigin(aspect);
    const heroProgress = MathUtils.clamp(window.scrollY / Math.max(hero.offsetHeight, 1), 0, 1);

    ringGroup.visible = heroVisible;
    if (heroVisible) placeRings(heroProgress, isNarrow, width);
    screens.forEach((screen) => placeScreen(screen, isNarrow, width));

    const active = stages.findIndex((stage) => isCentred(stage.element));
    targetColor.copy(active >= 0 ? (stageColors[active] ?? nightColor) : nightColor);
    clearColor.lerp(targetColor, SETTLE_SPEED);
    renderer.setClearColor(clearColor, 1);

    pointer.lerp(pointerTarget, SETTLE_SPEED);
    camera.position.x = pointer.x * 0.55;
    camera.position.y = -pointer.y * 0.35;
    camera.lookAt(0, 0, 0);
    particles.rotation.y = clock * 0.012;
    particles.position.y = (window.scrollY / window.innerHeight) * 0.3;

    renderer.render(scene, camera);
    lightenIfSlow(now);
    if (!announced) {
      announced = true;
      onFirstFrame();
    }
  };
  requestAnimationFrame(render);
}
