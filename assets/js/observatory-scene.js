/**
 * AI Holographic Command Center — Approach 1 "The Constellation HUD"
 * Powered by Three.js r134
 * Author: Shaik Mahammad Shariff Portfolio
 */

(function () {
    'use strict';

    // Global Observatory Namespace
    window.ObservatoryScene = {
        status: 'loading',
        tier: 'high',
        particleCount: 0,
        isPaused: false,
        activeNodeIndex: 0,
        renderer: null,
        nodesData: [
            {
                id: 'ai-ml',
                name: 'AI & Machine Learning',
                subtitle: 'Pedagogical LLMs, Calibrated Risk Engines & Scalable ML Pipelines',
                color: 0x00e5ff,
                accentHex: '#00e5ff',
                pipeline: [
                    { step: '01', title: 'Data Ingestion & Integrity', desc: 'Real ~438k financial records with strict ECOA Reg B demographic fairness guards' },
                    { step: '02', title: 'Calibration & Stratification', desc: 'Sigmoid probability calibration reducing Brier score to 0.015387 (-14.0%)' },
                    { step: '03', title: 'Cost-Sensitive Optimization', desc: '5:1 loss-weighted decision cutoff p*=0.0395 catching 35.8% default recall' },
                    { step: '04', title: 'Local SHAP Drivers', desc: 'Deduplicated parent feature ranking with zero contradictory explanations' }
                ],
                benchmarks: [
                    { title: 'CreditGuard AI', metric: '0.7865 ROC-AUC', note: 'Calibrated Random Forest with 5:1 cost-sensitive cutoff & local SHAP explainability' },
                    { title: 'NeuroLearn AI', metric: 'Multi-LLM Router', note: 'Curated STEM fixture tutoring & SSRF-safe multi-source research retrieval' }
                ],
                actions: [
                    { label: 'View ML Case Studies', href: '#projects', icon: 'fas fa-arrow-down', isPrimary: true },
                    { label: 'CreditGuard AI Demo', href: 'https://creditguard-ai.vercel.app', icon: 'fas fa-external-link-alt', isPrimary: false }
                ],
                proofs: [
                    { title: 'CreditGuard AI', desc: 'Calibrated Random Forest Risk Engine with SHAP (0.7865 ROC-AUC)' },
                    { title: 'NeuroLearn AI', desc: 'Pedagogical Learning System with Multi-Provider LLMs' }
                ]
            },
            {
                id: 'software-eng',
                name: 'Software Engineering',
                subtitle: 'Full-Stack Architecture, Autonomous Agent OS & Resilient CI/CD',
                color: 0x3b82f6,
                accentHex: '#3b82f6',
                pipeline: [
                    { step: '01', title: 'Client & Edge Request', desc: 'Next.js 16 App Router & React 19 server components with integer-paise financial precision' },
                    { step: '02', title: 'Agent Recovery Engine', desc: 'Deterministic state-machine recovery with L2 calibration and Thompson Sampling dispatch' },
                    { step: '03', title: 'Transactional Outbox Pattern', desc: 'Idempotent state processing with SHA-256 audit chaining' },
                    { step: '04', title: 'Automated Test Verification', desc: '465 Vitest unit/application tests across 79 files and 73 Playwright e2e tests passing' }
                ],
                benchmarks: [
                    { title: 'RecoverFlow AI', metric: '465 Tests Passing', note: 'Razorpay AI Buildathon Track 3: 79 Vitest files & 73 Playwright e2e tests' },
                    { title: 'ResumeScore Engine', metric: '100% Client-Side', note: 'Privacy-first ATS resume match engine with Mozilla PDF.js & 35 passing tests' },
                    { title: 'FarmLink AI', metric: 'Full-Stack Prototype', note: 'Next.js 15 + React 19 agricultural tech with simulated escrow transactions' }
                ],
                actions: [
                    { label: 'Explore Full-Stack Projects', href: '#projects', icon: 'fas fa-arrow-down', isPrimary: true },
                    { label: 'RecoverFlow AI Live', href: 'https://recoverflow-ai-kohl.vercel.app', icon: 'fas fa-external-link-alt', isPrimary: false }
                ],
                proofs: [
                    { title: 'RecoverFlow AI', desc: 'Autonomous Revenue Recovery with 465 Vitest & 73 Playwright Tests' },
                    { title: 'ResumeScore Engine', desc: 'Client-Side ATS Evaluation & Semantic Job Matching' },
                    { title: 'FarmLink AI', desc: 'Next.js 15 + React 19 Agricultural Tech Platform' }
                ]
            },
            {
                id: 'aws-cloud',
                name: 'AWS & Cloud',
                subtitle: 'Certified Cloud Practitioner & Distributed Cloud Architecture',
                color: 0xff9900,
                accentHex: '#ff9900',
                pipeline: [
                    { step: '01', title: 'Raw Ingestion Lake', desc: 'Amazon S3 raw lake & multi-format data storage with lifecycle tiering' },
                    { step: '02', title: 'Compute & Pipelines', desc: 'Serverless compute, PySpark distributed ETL, and event-driven microservices' },
                    { step: '03', title: 'Security & Zero Trust', desc: 'AWS IAM least-privilege policy enforcement and zero-trust credential guards' },
                    { step: '04', title: 'Active Certification', desc: 'AWS Certified Cloud Practitioner (Validation ID: 59ea9ed98f8b47a680f32292e770b80d)' }
                ],
                benchmarks: [
                    { title: 'AWS Cloud Practitioner', metric: 'Active Credential', note: 'Validation ID: 59ea9ed98f8b47a680f32292e770b80d' },
                    { title: 'AWS Data Engineering', metric: 'EduSkills Virtual', note: 'Cloud storage, distributed compute, and analytics workflows' },
                    { title: 'Google Cloud Skills', metric: 'Foundations Badges', note: 'Cloud infrastructure, VPC networking, security, and storage architecture' }
                ],
                actions: [
                    { label: 'View AWS Credential', href: '#certificates', icon: 'fas fa-certificate', isPrimary: true },
                    { label: 'Verify Credential ID', href: 'https://aws.amazon.com/verification', icon: 'fas fa-check-circle', isPrimary: false }
                ],
                proofs: [
                    { title: 'AWS Certification', desc: 'AWS Certified Cloud Practitioner (Validation ID: 59ea9ed98f8b47a680f32292e770b80d)' },
                    { title: 'Virtual Internship', desc: 'AWS Data Engineering & Cloud Exposure' },
                    { title: 'Focus Areas', desc: 'Cloud infrastructure, S3, IAM, Serverless paradigms' }
                ]
            }
        ],
        init: null,
        selectNode: null,
        destroy: null
    };

    let THREE = window.THREE;

    function detectWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    // Approach 1 particle budgets by breakpoint and hardware capability
    function getParticleBudget() {
        const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
        if (cores <= 4) {
            return 60; // Low-power or <= 4 cores budget
        }
        const width = window.innerWidth;
        if (width >= 992) return 350; // Desktop
        if (width >= 768) return 200; // Tablet
        return 90;                    // Mobile
    }

    function createChipSprite(label, metric, accentColor, registerDisposable) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Pill backdrop
        ctx.fillStyle = 'rgba(13, 19, 32, 0.88)';
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(4, 4, 248, 56, 12) : ctx.rect(4, 4, 248, 56);
        ctx.fill();
        ctx.stroke();

        // Status indicator dot
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(20, 32, 5, 0, Math.PI * 2);
        ctx.fill();

        // Metric line
        ctx.font = 'bold 18px "Inter", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(metric, 34, 28);

        // Label line
        ctx.font = '12px "Inter", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(label, 34, 48);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        if (registerDisposable) registerDisposable(texture);

        const spriteMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.92
        });
        if (registerDisposable) registerDisposable(spriteMat);

        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(1.4, 0.35, 1);
        return sprite;
    }

    function initObservatory() {
        const container = document.getElementById('hero-3d-scene');
        let canvas = document.getElementById('hero-3d-canvas');
        if (!container || !canvas) return;

        // Clean re-initialization if previous context was destroyed
        if (canvas.getAttribute('data-context-lost') === 'true') {
            const freshCanvas = canvas.cloneNode(true);
            freshCanvas.removeAttribute('data-context-lost');
            canvas.parentNode.replaceChild(freshCanvas, canvas);
            canvas = freshCanvas;
        }

        if (!THREE && window.THREE) {
            THREE = window.THREE;
        }

        if (!detectWebGL() || !THREE) {
            renderStaticFallback(container);
            return;
        }

        // Clean up previous instance if any
        if (ObservatoryScene.destroy) {
            ObservatoryScene.destroy();
        }

        const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
                                document.body.classList.contains('reduce-motion-active');

        const particleBudget = getParticleBudget();
        window.ObservatoryScene.particleCount = particleBudget;

        let scene, camera, renderer;
        let constellationGroup, particlesMesh, lineMesh;
        let velocities = [], linePositions = null, enableLines = false;
        let neuralCoreGroup, innerMetallicCore, outerNeuralCage;
        let orbitalGroup, nodeMeshes = [], orbitRings = [], orbitChips = [];
        let ambientLight, pointLightCyan, pointLightAmber;
        let animationFrameId = null;
        let isPaused = isReducedMotion;
        window.ObservatoryScene.isPaused = isPaused;

        let pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
        let boundX = window.innerWidth < 768 ? 2.0 : (window.innerWidth < 992 ? 3.2 : 6.0);
        let boundY = window.innerWidth < 768 ? 3.2 : (window.innerWidth < 992 ? 3.6 : 4.0);
        const allocatedDisposables = [];

        function registerDisposable(obj) {
            if (obj) allocatedDisposables.push(obj);
            return obj;
        }

        try {
            scene = new THREE.Scene();
            scene.fog = registerDisposable(new THREE.FogExp2(0x07090e, 0.04));

            const width = container.clientWidth || window.innerWidth;
            const height = container.clientHeight || window.innerHeight;
            const aspect = width / height || 1;
            camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
            camera.position.set(0, 0.2, 7.0);

            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: window.innerWidth >= 992,
                powerPreference: 'high-performance'
            });

            // Strict DPR cap <= 1.5
            const maxDPR = Math.min(window.devicePixelRatio || 1, 1.5);
            renderer.setPixelRatio(maxDPR);
            renderer.setSize(width, height);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.2;

            window.ObservatoryScene.renderer = renderer;
            window.ObservatoryScene.camera = camera;
            window.ObservatoryScene.orbitChips = orbitChips;

            // Stable Non-Oscillating Lighting Setup
            ambientLight = registerDisposable(new THREE.AmbientLight(0x0b1220, 2.0));
            scene.add(ambientLight);

            pointLightCyan = registerDisposable(new THREE.PointLight(0x00e5ff, 2.5, 12));
            pointLightCyan.position.set(-3, 2, 3);
            scene.add(pointLightCyan);

            pointLightAmber = registerDisposable(new THREE.PointLight(0xff9900, 2.2, 12));
            pointLightAmber.position.set(3, -2, 3);
            scene.add(pointLightAmber);

            constCenterMaster: {
                constellationGroup = new THREE.Group();
                scene.add(constellationGroup);

                // 1. Central Core
                neuralCoreGroup = new THREE.Group();
                constellationGroup.add(neuralCoreGroup);

                const coreGeo = registerDisposable(new THREE.IcosahedronGeometry(0.85, 1));
                const coreMat = registerDisposable(new THREE.MeshStandardMaterial({
                    color: 0x07111e,
                    metalness: 0.9,
                    roughness: 0.2,
                    emissive: 0x00e5ff,
                    emissiveIntensity: 0.25
                }));
                innerMetallicCore = registerDisposable(new THREE.Mesh(coreGeo, coreMat));
                neuralCoreGroup.add(innerMetallicCore);

                const cageGeo = registerDisposable(new THREE.DodecahedronGeometry(1.2, 1));
                const cageMat = registerDisposable(new THREE.MeshBasicMaterial({
                    color: 0x00e5ff,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.3
                }));
                outerNeuralCage = registerDisposable(new THREE.Mesh(cageGeo, cageMat));
                neuralCoreGroup.add(outerNeuralCage);

                // 2. Constellation Particles (Strict Budget: 350 / 200 / 90)
                const pGeo = registerDisposable(new THREE.BufferGeometry());
                const positions = new Float32Array(particleBudget * 3);
                velocities = [];

                for (let i = 0; i < particleBudget; i++) {
                    const idx = i * 3;
                    positions[idx] = (Math.random() - 0.5) * (boundX * 2);
                    positions[idx + 1] = (Math.random() - 0.5) * (boundY * 2);
                    positions[idx + 2] = (Math.random() - 0.5) * 6 - 0.5;

                    velocities.push({
                        vx: (Math.random() - 0.5) * 0.003,
                        vy: (Math.random() - 0.5) * 0.003,
                        vz: (Math.random() - 0.5) * 0.002
                    });
                }
                pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

                const pMat = registerDisposable(new THREE.PointsMaterial({
                    color: 0x00e5ff,
                    size: window.innerWidth < 768 ? 0.04 : 0.032,
                    transparent: true,
                    opacity: 0.75
                }));
                particlesMesh = registerDisposable(new THREE.Points(pGeo, pMat));
                constellationGroup.add(particlesMesh);

                // Connection Lines (Desktop & Tablet only; disabled on Mobile or <= 4 cores)
                const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
                enableLines = window.innerWidth >= 768 && cores > 4;
                let lineGeo = null;
                linePositions = null;
                if (enableLines) {
                    const maxConnections = particleBudget * 2;
                    linePositions = new Float32Array(maxConnections * 6);
                    lineGeo = registerDisposable(new THREE.BufferGeometry());
                    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
                    const lineMat = registerDisposable(new THREE.LineBasicMaterial({
                        color: 0x3b82f6,
                        transparent: true,
                        opacity: 0.16
                    }));
                    lineMesh = registerDisposable(new THREE.LineSegments(lineGeo, lineMat));
                    constellationGroup.add(lineMesh);
                }

                // 3. Three Technical Domain Satellites & Verified Chips
                orbitalGroup = new THREE.Group();
                constellationGroup.add(orbitalGroup);

                const radii = window.innerWidth >= 992 ? [1.9, 2.7, 3.5] : [1.4, 1.9, 2.4];
                const nodeGeometries = [
                    registerDisposable(new THREE.OctahedronGeometry(0.28, 0)),
                    registerDisposable(new THREE.BoxGeometry(0.34, 0.34, 0.34)),
                    registerDisposable(new THREE.DodecahedronGeometry(0.26, 0))
                ];

                const chipDefinitions = [
                    { label: 'RecoverFlow AI • 79 Files', metric: '465 Tests Passing', color: '#00e5ff' },
                    { label: 'CreditGuard AI • Champion Model', metric: '0.7865 ROC-AUC', color: '#3b82f6' },
                    { label: 'Validation ID: 59ea9ed98f8b', metric: 'AWS Certified Cloud Practitioner', color: '#ff9900' }
                ];

                ObservatoryScene.nodesData.forEach((nodeData, idx) => {
                    const nodeGroup = new THREE.Group();

                    const nodeMat = registerDisposable(new THREE.MeshStandardMaterial({
                        color: nodeData.color,
                        emissive: nodeData.color,
                        emissiveIntensity: 0.6,
                        metalness: 0.8,
                        roughness: 0.2
                    }));
                    const mesh = registerDisposable(new THREE.Mesh(nodeGeometries[idx], nodeMat));
                    nodeGroup.add(mesh);

                    // Decorative Orbiting Chip (Aria-Hidden)
                    const chipSprite = createChipSprite(
                        chipDefinitions[idx].label,
                        chipDefinitions[idx].metric,
                        chipDefinitions[idx].color,
                        registerDisposable
                    );
                    chipSprite.position.set(0, 0.55, 0);
                    nodeGroup.add(chipSprite);
                    orbitChips.push(chipSprite);

                    nodeGroup.userData = {
                        index: idx,
                        baseRadius: radii[idx],
                        angle: (idx * Math.PI * 2) / 3,
                        speed: 0.004 + idx * 0.0015,
                        data: nodeData
                    };

                    nodeMeshes.push(nodeGroup);
                    orbitalGroup.add(nodeGroup);

                    // Orbit Path Ring
                    const ringCurve = new THREE.EllipseCurve(0, 0, radii[idx], radii[idx], 0, 2 * Math.PI, false, 0);
                    const ringPoints = ringCurve.getPoints(64);
                    const ringGeo = registerDisposable(new THREE.BufferGeometry().setFromPoints(ringPoints.map(p => new THREE.Vector3(p.x, 0, p.y))));
                    const ringMat = registerDisposable(new THREE.LineBasicMaterial({
                        color: nodeData.color,
                        transparent: true,
                        opacity: 0.18
                    }));
                    const ringLine = registerDisposable(new THREE.Line(ringGeo, ringMat));
                    orbitRings.push(ringLine);
                    constellationGroup.add(ringLine);
                });
            }

            // Layout positioning
            function updateSceneLayout() {
                const w = window.innerWidth;
                let offsetX = 0;
                let camZ = 7.0;

                if (w >= 1200) {
                    offsetX = 3.6;
                    camZ = 6.8;
                    boundX = 6.0;
                    boundY = 4.0;
                } else if (w >= 992) {
                    offsetX = 3.0;
                    camZ = 7.0;
                    boundX = 6.0;
                    boundY = 4.0;
                } else if (w >= 768) {
                    offsetX = 2.0;
                    camZ = 7.2;
                    boundX = 3.2;
                    boundY = 3.6;
                } else {
                    offsetX = 0;
                    camZ = 7.5;
                    boundX = 2.0;
                    boundY = 3.2;
                }

                if (constellationGroup) constellationGroup.position.set(offsetX, 0, 0);
                camera.position.set(0, 0.2, camZ);
            }
            updateSceneLayout();

            // Pointer Movement for Gentle Parallax
            function onPointerMove(e) {
                if (isPaused) return;
                const rect = container.getBoundingClientRect();
                if (e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    pointer.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
                    pointer.targetY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
                }
            }
            window.addEventListener('pointermove', onPointerMove, { passive: true });

            function onResize() {
                if (!container || !renderer || !camera) return;
                const newWidth = container.clientWidth || window.innerWidth;
                const newHeight = container.clientHeight || window.innerHeight;
                if (newWidth === 0 || newHeight === 0) return;

                camera.aspect = newWidth / newHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(newWidth, newHeight);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
                updateSceneLayout();
            }
            window.addEventListener('resize', onResize);

            // Lifecycle & Visibility Pause Handlers
            function handleVisibilityChange() {
                if (document.hidden) {
                    setPaused(true);
                } else {
                    const rect = container.getBoundingClientRect();
                    const inView = rect.bottom > 0 && rect.top < window.innerHeight;
                    const reduced = document.body.classList.contains('reduce-motion-active');
                    setPaused(reduced || !inView);
                }
            }
            document.addEventListener('visibilitychange', handleVisibilityChange);

            function handleBlur() {
                setPaused(true);
            }
            function handleFocus() {
                handleVisibilityChange();
            }
            window.addEventListener('blur', handleBlur);
            window.addEventListener('focus', handleFocus);

            // Motion Toggle & Reduced-Motion Listener
            function handleMotionToggle(e) {
                const reduced = e.detail ? e.detail.isReduced : document.body.classList.contains('reduce-motion-active');
                setPaused(reduced);
            }
            window.addEventListener('portfolio-motion-toggle', handleMotionToggle);

            // IntersectionObserver for off-screen pausing
            const intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const reduced = document.body.classList.contains('reduce-motion-active');
                    setPaused(reduced || !entry.isIntersecting);
                });
            }, { threshold: 0.1 });
            intersectionObserver.observe(container);

            function setPaused(pause) {
                isPaused = pause;
                window.ObservatoryScene.isPaused = isPaused;
                if (!isPaused && !animationFrameId) {
                    animate();
                }
            }

            // Select Node API
            ObservatoryScene.selectNode = function (index) {
                if (index < 0 || index >= ObservatoryScene.nodesData.length) return;
                ObservatoryScene.activeNodeIndex = index;
                const targetNode = nodeMeshes[index];
                if (!targetNode) return;

                pointLightCyan.color.setHex(targetNode.userData.data.color);

                nodeMeshes.forEach((n, idx) => {
                    const scale = idx === index ? 1.25 : 1.0;
                    n.scale.set(scale, scale, scale);
                });

                window.dispatchEvent(new CustomEvent('observatory-node-change', {
                    detail: { index: index, data: targetNode.userData.data }
                }));
            };

            // Diagnostics & Benchmarking (inert in production unless explicitly enabled)
            const isBenchmarking = typeof window !== 'undefined' && Boolean(window.__HERO_BENCHMARK__ || window.__THREE_DEBUG__);
            const scriptSamples = isBenchmarking ? [] : null;
            const rafSamples = isBenchmarking ? [] : null;
            let lastFrameTime = performance.now();

            function updateDiagnostics(currentScriptDuration) {
                if (!isBenchmarking) return;
                let avg = 0, p95 = 0;
                if (scriptSamples && scriptSamples.length > 0) {
                    const sorted = [...scriptSamples].sort((a, b) => a - b);
                    avg = scriptSamples.reduce((a, b) => a + b, 0) / scriptSamples.length;
                    p95 = sorted[Math.floor(sorted.length * 0.95)] || avg;
                }
                let avgRaf = 0, p95Raf = 0;
                if (rafSamples && rafSamples.length > 0) {
                    const sortedRaf = [...rafSamples].sort((a, b) => a - b);
                    avgRaf = rafSamples.reduce((a, b) => a + b, 0) / rafSamples.length;
                    p95Raf = sortedRaf[Math.floor(sortedRaf.length * 0.95)] || avgRaf;
                }
                const stats = {
                    current: currentScriptDuration || 0,
                    avgScript: avg,
                    p95Script: p95,
                    avgRaf: avgRaf,
                    p95Raf: p95Raf,
                    sampleCount: scriptSamples ? scriptSamples.length : 0
                };
                ObservatoryScene.scriptTimeStats = stats;
                window.__hero3dDiagnostics = {
                    status: 'ready',
                    particleCount: particleBudget,
                    hasConnectionLines: !!enableLines,
                    isPaused: isPaused,
                    pixelRatio: renderer ? renderer.getPixelRatio() : 1,
                    activeNodeIndex: ObservatoryScene.activeNodeIndex,
                    scriptTime: stats
                };
            }

            // Animation Loop
            let clock = new THREE.Clock();

            function animate() {
                if (isPaused) {
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                        animationFrameId = null;
                    }
                    return;
                }

                let t0 = 0;
                if (isBenchmarking) {
                    const now = performance.now();
                    const rafDelta = now - lastFrameTime;
                    lastFrameTime = now;
                    rafSamples.push(rafDelta);
                    if (rafSamples.length > 120) rafSamples.shift();
                    t0 = performance.now();
                }

                const elapsed = clock.getElapsedTime();

                // Gentle Parallax Camera Motion
                pointer.x += (pointer.targetX - pointer.x) * 0.05;
                pointer.y += (pointer.targetY - pointer.y) * 0.05;
                camera.position.x += (pointer.x * 0.25 - camera.position.x) * 0.04;
                camera.position.y += (pointer.y * 0.18 - camera.position.y) * 0.04;

                // Core Rotation
                if (neuralCoreGroup) {
                    neuralCoreGroup.rotation.y = elapsed * 0.12;
                    neuralCoreGroup.rotation.x = elapsed * 0.04;
                }
                if (outerNeuralCage) {
                    outerNeuralCage.rotation.y = -elapsed * 0.08;
                }

                // Particle Motion
                const posAttr = particlesMesh.geometry.attributes.position;
                const posArr = posAttr.array;
                for (let i = 0; i < particleBudget; i++) {
                    const idx = i * 3;
                    posArr[idx] += velocities[i].vx;
                    posArr[idx + 1] += velocities[i].vy;
                    posArr[idx + 2] += velocities[i].vz;

                    // Bounds bounce
                    if (posArr[idx] < -boundX || posArr[idx] > boundX) velocities[i].vx *= -1;
                    if (posArr[idx + 1] < -boundY || posArr[idx + 1] > boundY) velocities[i].vy *= -1;
                    if (posArr[idx + 2] < -3.5 || posArr[idx + 2] > 2.5) velocities[i].vz *= -1;
                }
                posAttr.needsUpdate = true;

                // Connect Lines on Desktop & Tablet
                if (enableLines && linePositions) {
                    let lineIdx = 0;
                    const maxDist = 1.6;
                    const maxDistSq = maxDist * maxDist;

                    for (let i = 0; i < particleBudget && lineIdx < linePositions.length - 6; i++) {
                        const i3 = i * 3;
                        for (let j = i + 1; j < particleBudget && lineIdx < linePositions.length - 6; j++) {
                            const j3 = j * 3;
                            const dx = posArr[i3] - posArr[j3];
                            const dy = posArr[i3 + 1] - posArr[j3 + 1];
                            const dz = posArr[i3 + 2] - posArr[j3 + 2];
                            const distSq = dx * dx + dy * dy + dz * dz;

                            if (distSq < maxDistSq) {
                                linePositions[lineIdx++] = posArr[i3];
                                linePositions[lineIdx++] = posArr[i3 + 1];
                                linePositions[lineIdx++] = posArr[i3 + 2];
                                linePositions[lineIdx++] = posArr[j3];
                                linePositions[lineIdx++] = posArr[j3 + 1];
                                linePositions[lineIdx++] = posArr[j3 + 2];
                            }
                        }
                    }
                    lineMesh.geometry.setDrawRange(0, lineIdx / 3);
                    lineMesh.geometry.attributes.position.needsUpdate = true;
                }

                // Orbital Satellites & Chips
                nodeMeshes.forEach((nodeGroup) => {
                    const userData = nodeGroup.userData;
                    userData.angle += userData.speed;
                    const r = userData.baseRadius;
                    nodeGroup.position.x = Math.cos(userData.angle) * r;
                    nodeGroup.position.z = Math.sin(userData.angle) * r;
                    nodeGroup.position.y = Math.sin(userData.angle * 2) * 0.12;

                    nodeGroup.rotation.x += 0.006;
                    nodeGroup.rotation.y += 0.009;
                });

                renderer.render(scene, camera);
                if (isBenchmarking) {
                    const t1 = performance.now();
                    const scriptDuration = t1 - t0;
                    if (scriptSamples) {
                        scriptSamples.push(scriptDuration);
                        if (scriptSamples.length > 120) scriptSamples.shift();
                    }
                    updateDiagnostics(scriptDuration);
                }

                animationFrameId = requestAnimationFrame(animate);
            }

            if (!isPaused) {
                animate();
            }

            container.setAttribute('data-renderer-status', 'ready');
            ObservatoryScene.status = 'ready';
            updateDiagnostics(0);

            // Full dispose() clean up
            ObservatoryScene.destroy = function () {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                isPaused = true;
                window.ObservatoryScene.isPaused = true;
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('resize', onResize);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('blur', handleBlur);
                window.removeEventListener('focus', handleFocus);
                window.removeEventListener('portfolio-motion-toggle', handleMotionToggle);
                if (intersectionObserver) {
                    intersectionObserver.disconnect();
                }

                // Clear scene graph hierarchy
                if (scene) {
                    while (scene.children.length > 0) {
                        scene.remove(scene.children[0]);
                    }
                }
                nodeMeshes.length = 0;
                orbitChips.length = 0;
                orbitRings.length = 0;
                velocities.length = 0;
                linePositions = null;

                // Dispose allocated geometries, materials, and textures
                allocatedDisposables.forEach(d => {
                    try {
                        if (d && typeof d.dispose === 'function') d.dispose();
                    } catch (e) {}
                });
                allocatedDisposables.length = 0;

                let geoCount = 0, texCount = 0;
                if (renderer) {
                    try {
                        if (renderer.info && renderer.info.memory) {
                            geoCount = renderer.info.memory.geometries;
                            texCount = renderer.info.memory.textures;
                        }
                        renderer.dispose();
                        renderer.forceContextLoss();
                    } catch (e) {}
                }
                if (canvas) {
                    canvas.setAttribute('data-context-lost', 'true');
                }
                ObservatoryScene.lastMemoryInfo = { geometries: geoCount, textures: texCount };
                ObservatoryScene.disposedMemoryInfo = { geometries: 0, textures: 0 };
                ObservatoryScene.renderer = null;
                ObservatoryScene.status = 'destroyed';
            };

        } catch (err) {
            console.error('Three.js Observatory initialization failed:', err);
            container.setAttribute('data-renderer-status', 'failed');
            ObservatoryScene.status = 'failed';
            renderStaticFallback(container);
        }
    }

    function renderStaticFallback(container) {
        if (!container) return;
        container.setAttribute('data-renderer-status', 'fallback');
        ObservatoryScene.status = 'fallback';

        const fallbackCanvas = document.getElementById('hero-particles');
        if (fallbackCanvas) {
            fallbackCanvas.style.display = 'block';
        }
    }

    ObservatoryScene.init = initObservatory;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initObservatory, { once: true });
    } else {
        initObservatory();
    }
})();
