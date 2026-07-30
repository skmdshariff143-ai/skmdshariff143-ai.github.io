/**
 * Genuine WebGL 3D Hero Scene for Shaik Mahammad Shariff Portfolio
 * Powered by Three.js v0.185.1 (Locally vendored ES module: assets/vendor/three.module.min.js)
 */

import * as THREE from '../vendor/three.module.min.js';

// State & DOM Elements
let container, renderer, scene, camera;
let aiCoreWireframe, aiCoreSolid, orbitalRings = [], signalParticles = [], depthParticleSystem, neuralLines;
let animationFrameId = null;
let isIntersecting = true;
let isTabVisible = true;
let mouseX = 0, mouseY = 0;
let targetCameraX = 0, targetCameraY = 0;
const isMobile = window.innerWidth <= 768;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Safely check WebGL support
function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}

function setStatus(status) {
    if (container) {
        container.dataset.rendererStatus = status;
        container.setAttribute('data-renderer-status', status);
    }
}

function updateDiagnostics() {
    if (renderer) {
        window.__hero3dDiagnostics = {
            rendererInfo: renderer.info,
            pixelRatio: renderer.getPixelRatio(),
            animationRunning: !!animationFrameId,
            reducedMotion: prefersReducedMotion,
            mobileMode: isMobile
        };
    }
}

function init() {
    container = document.getElementById('hero-3d-scene');
    if (!container) return;

    if (!isWebGLAvailable()) {
        console.warn('[3D Hero] WebGL not supported. Falling back to 2D canvas.');
        setStatus('fallback');
        const fallbackCanvas = document.getElementById('hero-particles');
        if (fallbackCanvas) {
            fallbackCanvas.style.display = 'block';
            fallbackCanvas.style.opacity = '1';
        }
        return;
    }

    setStatus('loading');

    try {
        createScene();
        createAICore();
        createOrbitalRings();
        createSignalParticles();
        createDepthParticles();
        createNeuralConnections();
        setupLights();
        setupEvents();

        setStatus('ready');
        updateDiagnostics();

        // Render static frame if reduced motion is requested
        if (prefersReducedMotion) {
            render();
        } else {
            animate();
        }

        // Hide/fade 2D fallback canvas gracefully
        const fallbackCanvas = document.getElementById('hero-particles');
        if (fallbackCanvas) {
            fallbackCanvas.style.opacity = '0.35';
        }
    } catch (err) {
        console.error('[3D Hero] Error initializing Three.js scene:', err);
        setStatus('error');
        const fallbackCanvas = document.getElementById('hero-particles');
        if (fallbackCanvas) {
            fallbackCanvas.style.display = 'block';
            fallbackCanvas.style.opacity = '1';
        }
    }
}

function createScene() {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    let canvas = document.getElementById('hero-3d-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'hero-3d-canvas';
        canvas.className = 'hero-3d-canvas';
        container.appendChild(canvas);
    }

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a14, 0.04);

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, isMobile ? 11 : 9);

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: !isMobile,
        powerPreference: 'high-performance'
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    canvas.setAttribute('aria-hidden', 'true');
}

function createAICore() {
    const coreGroup = new THREE.Group();
    coreGroup.name = 'aiCoreGroup';

    // Outer Wireframe Icosahedron
    const outerGeo = new THREE.IcosahedronGeometry(isMobile ? 1.4 : 1.7, 2);
    const outerMat = new THREE.MeshBasicMaterial({
        color: 0x00f2fe,
        wireframe: true,
        transparent: true,
        opacity: 0.55
    });
    aiCoreWireframe = new THREE.Mesh(outerGeo, outerMat);
    coreGroup.add(aiCoreWireframe);

    // Inner Solid Faceted Core
    const innerGeo = new THREE.IcosahedronGeometry(isMobile ? 0.95 : 1.15, 1);
    const innerMat = new THREE.MeshPhongMaterial({
        color: 0x00d2ff,
        emissive: 0x004466,
        specular: 0xffffff,
        shininess: 90,
        flatShading: true,
        transparent: true,
        opacity: 0.85
    });
    aiCoreSolid = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(aiCoreSolid);

    // Position core slightly to the right on desktop to frame profile portrait
    coreGroup.position.set(isMobile ? 0 : 2.0, 0.2, 0);
    scene.add(coreGroup);
}

function createOrbitalRings() {
    const ringConfigs = [
        { radius: isMobile ? 2.1 : 2.5, tube: 0.02, rotX: Math.PI / 3, rotY: Math.PI / 8, rotZ: 0, color: 0x00f2fe, speed: 0.008 },
        { radius: isMobile ? 2.8 : 3.3, tube: 0.018, rotX: -Math.PI / 4, rotY: Math.PI / 3, rotZ: Math.PI / 6, color: 0x3a7bd5, speed: -0.006 },
        { radius: isMobile ? 3.5 : 4.1, tube: 0.015, rotX: Math.PI / 2.2, rotY: -Math.PI / 4, rotZ: -Math.PI / 5, color: 0x00d2ff, speed: 0.004 }
    ];

    ringConfigs.forEach((config) => {
        const ringGeo = new THREE.TorusGeometry(config.radius, config.tube, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.65,
            wireframe: false
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.set(config.rotX, config.rotY, config.rotZ);

        // Group for rotation
        const ringPivot = new THREE.Group();
        ringPivot.position.set(isMobile ? 0 : 2.0, 0.2, 0);
        ringPivot.add(ringMesh);
        ringPivot.userData = { speed: config.speed, mesh: ringMesh };

        scene.add(ringPivot);
        orbitalRings.push(ringPivot);
    });
}

function createSignalParticles() {
    const particleCount = isMobile ? 12 : 24;
    const particleGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.95
    });

    for (let i = 0; i < particleCount; i++) {
        const pMesh = new THREE.Mesh(particleGeo, particleMat);
        const ringIndex = i % orbitalRings.length;
        const ringPivot = orbitalRings[ringIndex];
        const radius = ringPivot.children[0].geometry.parameters.radius;

        pMesh.userData = {
            angle: (i / particleCount) * Math.PI * 2,
            speed: (0.01 + Math.random() * 0.015) * (i % 2 === 0 ? 1 : -1),
            radius: radius,
            ringPivot: ringPivot
        };
        scene.add(pMesh);
        signalParticles.push(pMesh);
    }
}

function createDepthParticles() {
    const count = isMobile ? 180 : 450;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorOptions = [
        new THREE.Color(0x00f2fe),
        new THREE.Color(0x00d2ff),
        new THREE.Color(0x3a7bd5),
        new THREE.Color(0x8a2be2)
    ];

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 22;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2;

        const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: isMobile ? 0.05 : 0.07,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending
    });

    depthParticleSystem = new THREE.Points(geometry, material);
    scene.add(depthParticleSystem);
}

function createNeuralConnections() {
    const nodeCount = isMobile ? 15 : 30;
    const nodePositions = [];

    for (let i = 0; i < nodeCount; i++) {
        nodePositions.push(new THREE.Vector3(
            (Math.random() - 0.5) * 14,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 8
        ));
    }

    const linePositions = [];
    const maxDistance = 4.5;

    for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
            const dist = nodePositions[i].distanceTo(nodePositions[j]);
            if (dist < maxDistance) {
                linePositions.push(
                    nodePositions[i].x, nodePositions[i].y, nodePositions[i].z,
                    nodePositions[j].x, nodePositions[j].y, nodePositions[j].z
                );
            }
        }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    const lineMat = new THREE.LineBasicMaterial({
        color: 0x00d2ff,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
    });

    neuralLines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(neuralLines);
}

function setupLights() {
    const ambientLight = new THREE.AmbientLight(0x0a192f, 1.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00f2fe, 2.5, 25);
    pointLight1.position.set(isMobile ? 0 : 2, 2, 4);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x3a7bd5, 2.0, 30);
    pointLight2.position.set(-4, -3, 2);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x00d2ff, 1.5, 20);
    pointLight3.position.set(3, -2, 3);
    scene.add(pointLight3);
}

function setupEvents() {
    window.addEventListener('resize', onWindowResize, { passive: true });

    if (!isMobile) {
        window.addEventListener('mousemove', onPointerMove, { passive: true });
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Page Visibility & Off-screen pause
    document.addEventListener('visibilitychange', () => {
        isTabVisible = !document.hidden;
        if (isTabVisible && isIntersecting && !prefersReducedMotion) {
            if (!animationFrameId) animate();
        }
    });

    const heroSection = document.getElementById('hero');
    if (heroSection && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                isIntersecting = entry.isIntersecting;
                if (isIntersecting && isTabVisible && !prefersReducedMotion) {
                    if (!animationFrameId) animate();
                }
            });
        }, { threshold: 0.05 });
        observer.observe(heroSection);
    }
}

function onPointerMove(e) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
}

function onScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    if (camera && scrollY < 1200) {
        camera.position.y = -scrollY * 0.0015;
    }
}

function onWindowResize() {
    if (!container || !renderer || !camera) return;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function animate() {
    if (!isIntersecting || !isTabVisible) {
        animationFrameId = null;
        return;
    }

    render();
    animationFrameId = requestAnimationFrame(animate);
}

function render() {
    const time = performance.now() * 0.001;

    // Damped Parallax Camera
    targetCameraX = mouseX * 0.6;
    targetCameraY = -mouseY * 0.4;
    camera.position.x += (targetCameraX - camera.position.x) * 0.04;
    camera.position.y += (targetCameraY - camera.position.y) * 0.04;
    camera.lookAt(isMobile ? 0 : 1.0, 0, 0);

    // Core Rotation & Pulsation
    if (aiCoreWireframe) {
        aiCoreWireframe.rotation.x = time * 0.15;
        aiCoreWireframe.rotation.y = time * 0.22;
    }
    if (aiCoreSolid) {
        aiCoreSolid.rotation.x = -time * 0.2;
        aiCoreSolid.rotation.y = -time * 0.12;
        const pulse = 1 + Math.sin(time * 2.5) * 0.05;
        aiCoreSolid.scale.set(pulse, pulse, pulse);
    }

    // Orbital Ring Rotations
    orbitalRings.forEach((pivot) => {
        pivot.rotation.z += pivot.userData.speed;
        pivot.rotation.y += pivot.userData.speed * 0.5;
    });

    // Signal Particles along Orbits
    signalParticles.forEach((pMesh) => {
        const data = pMesh.userData;
        data.angle += data.speed;
        const pivotRot = data.ringPivot.rotation;

        const posX = Math.cos(data.angle) * data.radius;
        const posY = Math.sin(data.angle) * data.radius;

        // Compute local orbit coordinate transformed by ring rotation
        const vec = new THREE.Vector3(posX, posY, 0);
        vec.applyEuler(pivotRot);
        vec.add(data.ringPivot.position);

        pMesh.position.copy(vec);
    });

    // Depth Particles Rotation
    if (depthParticleSystem) {
        depthParticleSystem.rotation.y = time * 0.03;
    }

    // Neural Lines Subtle Float
    if (neuralLines) {
        neuralLines.rotation.z = Math.sin(time * 0.2) * 0.05;
    }

    renderer.render(scene, camera);
}

// Auto Init on DOM Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Expose init function globally for QA diagnostics
window.initThreeHero = init;
