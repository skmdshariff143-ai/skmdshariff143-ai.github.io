/**
 * AI Holographic Command Center — 3D Scene Module
 * Powered by Three.js
 * Author: Shaik Mahammad Shariff Portfolio
 */

(function () {
    'use strict';

    // Global Observatory Namespace
    window.ObservatoryScene = {
        status: 'loading',
        tier: 'high',
        activeNodeIndex: 0,
        nodesData: [
            {
                id: 'ai-ml',
                name: 'AI & Machine Learning',
                subtitle: 'Predictive Modeling & Neural Workflows',
                color: 0x00e5ff,
                accentHex: '#00e5ff',
                proofs: [
                    { title: 'CreditGuard AI', desc: 'Financial Risk Assessment Platform' },
                    { title: 'Core Stack', desc: 'Python, Scikit-learn, XGBoost, Pandas' },
                    { title: 'Focus Areas', desc: 'Predictive modeling, data preprocessing, feature engineering' }
                ]
            },
            {
                id: 'software-eng',
                name: 'Software Engineering',
                subtitle: 'Full-Stack Architecture & Web Systems',
                color: 0x4f7cff,
                accentHex: '#4f7cff',
                proofs: [
                    { title: 'FarmaLink-AI', desc: 'Agricultural Tech & Marketplace Platform' },
                    { title: 'Core Stack', desc: 'Java, JavaScript/TypeScript, React/Next.js, Node.js' },
                    { title: 'Focus Areas', desc: 'Modular design, RESTful APIs, Git workflows, responsive UX' }
                ]
            },
            {
                id: 'aws-cloud',
                name: 'AWS & Cloud',
                subtitle: 'Certified Cloud & Data Engineering',
                color: 0x8b5cf6,
                accentHex: '#8b5cf6',
                proofs: [
                    { title: 'AWS Certification', desc: 'AWS Certified Cloud Practitioner (Verified)' },
                    { title: 'Virtual Internship', desc: 'AWS Data Engineering & Cloud Exposure' },
                    { title: 'Focus Areas', desc: 'Cloud infrastructure, S3, IAM, Serverless paradigms' }
                ]
            }
        ],
        init: null,
        selectNode: null,
        setTier: null,
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

    function determineQualityTier() {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) return 'low';

        const isMobile = window.innerWidth < 768;
        const memory = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;

        if (isMobile || memory < 4 || cores < 4) {
            return 'balanced';
        }
        return 'high';
    }

    function initObservatory() {
        const container = document.getElementById('hero-3d-scene');
        const canvas = document.getElementById('hero-3d-canvas');
        if (!container || !canvas) return;

        if (!THREE && window.THREE) {
            THREE = window.THREE;
        }

        if (!detectWebGL() || !THREE) {
            renderStaticFallback(container);
            return;
        }

        const tier = determineQualityTier();
        window.ObservatoryScene.tier = tier;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let scene, camera, renderer;
        let commandCenterGroup, neuralCoreGroup, innerMetallicCore, outerNeuralCage, dataRingPrimary, dataRingSecondary;
        let workstationGrid, hudPanelsGroup = [];
        let orbitalGroup, nodeMeshes = [], orbitRings = [];
        let starfieldParticles, dataPulseSignals = [];
        let ambientLight, pointLightCyan, pointLightViolet, directionalLight;
        let animationFrameId;
        let isPaused = false;
        let totalParticleCount = 0;
        let pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

        try {
            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x05070d, 0.03);

            const aspect = container.clientWidth / container.clientHeight || 1;
            camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
            camera.position.set(0, 0.4, 6.8);

            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: tier === 'high',
                powerPreference: 'high-performance'
            });

            const maxPixelRatio = tier === 'high' ? Math.min(window.devicePixelRatio, 1.75) : (tier === 'balanced' ? Math.min(window.devicePixelRatio, 1.25) : 1.0);
            renderer.setPixelRatio(maxPixelRatio);
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.25;

            // STABLE CONSTANT LIGHTING SETUP (No intensity oscillation)
            ambientLight = new THREE.AmbientLight(0x0b1220, 1.8);
            scene.add(ambientLight);

            pointLightCyan = new THREE.PointLight(0x00e5ff, 3.2, 14);
            pointLightCyan.position.set(-3.5, 2.5, 3.5);
            scene.add(pointLightCyan);

            pointLightViolet = new THREE.PointLight(0x8b5cf6, 3.2, 14);
            pointLightViolet.position.set(3.5, -2.5, 2.5);
            scene.add(pointLightViolet);

            directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
            directionalLight.position.set(0, 6, 6);
            scene.add(directionalLight);

            // Master Group for 3D Holographic Command Center
            commandCenterGroup = new THREE.Group();
            scene.add(commandCenterGroup);

            // 1. Central Neural Core (AI Command Center Heart)
            neuralCoreGroup = new THREE.Group();
            commandCenterGroup.add(neuralCoreGroup);

            // Inner Faceted Metallic Core
            const coreGeo = new THREE.IcosahedronGeometry(0.95, 1);
            const coreMat = new THREE.MeshStandardMaterial({
                color: 0x07111e,
                metalness: 0.9,
                roughness: 0.15,
                emissive: 0x00e5ff,
                emissiveIntensity: 0.25
            });
            innerMetallicCore = new THREE.Mesh(coreGeo, coreMat);
            neuralCoreGroup.add(innerMetallicCore);

            // Holographic Neural Outer Cage
            const cageGeo = new THREE.DodecahedronGeometry(1.35, 1);
            const cageMat = new THREE.MeshBasicMaterial({
                color: 0x00e5ff,
                wireframe: true,
                transparent: true,
                opacity: 0.35
            });
            outerNeuralCage = new THREE.Mesh(cageGeo, cageMat);
            neuralCoreGroup.add(outerNeuralCage);

            // Primary Glowing Data Ring
            const ringGeo1 = new THREE.TorusGeometry(1.75, 0.018, 16, 64);
            const ringMat1 = new THREE.MeshBasicMaterial({
                color: 0x00e5ff,
                transparent: true,
                opacity: 0.55
            });
            dataRingPrimary = new THREE.Mesh(ringGeo1, ringMat1);
            dataRingPrimary.rotation.x = Math.PI / 3;
            neuralCoreGroup.add(dataRingPrimary);

            // Secondary Violet Data Ring
            const ringGeo2 = new THREE.TorusGeometry(2.1, 0.012, 16, 64);
            const ringMat2 = new THREE.MeshBasicMaterial({
                color: 0x8b5cf6,
                transparent: true,
                opacity: 0.4
            });
            dataRingSecondary = new THREE.Mesh(ringGeo2, ringMat2);
            dataRingSecondary.rotation.x = -Math.PI / 4;
            dataRingSecondary.rotation.y = Math.PI / 6;
            neuralCoreGroup.add(dataRingSecondary);

            // Inner Neural Point Cloud
            const neuralPointCount = tier === 'high' ? 350 : 180;
            totalParticleCount += neuralPointCount;
            const pointsGeo = new THREE.BufferGeometry();
            const positions = new Float32Array(neuralPointCount * 3);
            for (let i = 0; i < neuralPointCount * 3; i += 3) {
                const r = 0.85 * Math.cbrt(Math.random());
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                positions[i] = r * Math.sin(phi) * Math.cos(theta);
                positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
                positions[i + 2] = r * Math.cos(phi);
            }
            pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const pointsMat = new THREE.PointsMaterial({
                color: 0x00e5ff,
                size: 0.035,
                transparent: true,
                opacity: 0.85
            });
            const neuralPointsMesh = new THREE.Points(pointsGeo, pointsMat);
            neuralCoreGroup.add(neuralPointsMesh);

            // 2. Procedural Holographic Workstation Grid Pedestal
            workstationGrid = new THREE.GridHelper(14, 28, 0x00e5ff, 0x1e293b);
            workstationGrid.position.y = -2.1;
            workstationGrid.material.transparent = true;
            workstationGrid.material.opacity = 0.18;
            commandCenterGroup.add(workstationGrid);

            // 3. Three Technical Domain Satellites with Procedural HUD Panels
            orbitalGroup = new THREE.Group();
            commandCenterGroup.add(orbitalGroup);

            const isDesktop = window.innerWidth >= 992;
            const radii = isDesktop ? [2.4, 3.2, 4.0] : [1.8, 2.3, 2.8];

            const nodeGeometries = [
                new THREE.OctahedronGeometry(0.34, 0),     // AI & ML
                new THREE.BoxGeometry(0.42, 0.42, 0.42),    // Software Eng
                new THREE.DodecahedronGeometry(0.32, 0)      // AWS & Cloud
            ];

            ObservatoryScene.nodesData.forEach((nodeData, idx) => {
                const nodeGroup = new THREE.Group();

                // Satellite Core Mesh
                const nodeMat = new THREE.MeshStandardMaterial({
                    color: nodeData.color,
                    emissive: nodeData.color,
                    emissiveIntensity: 0.65,
                    metalness: 0.85,
                    roughness: 0.2
                });
                const mesh = new THREE.Mesh(nodeGeometries[idx], nodeMat);
                nodeGroup.add(mesh);

                // Holographic HUD Wireframe Frame around Node
                const hudGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
                const hudMat = new THREE.MeshBasicMaterial({
                    color: nodeData.color,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.3
                });
                const hudFrame = new THREE.Mesh(hudGeo, hudMat);
                nodeGroup.add(hudFrame);

                // Accent Orbit Ring around Node
                const ringGeo = new THREE.TorusGeometry(0.5, 0.01, 8, 32);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: nodeData.color,
                    transparent: true,
                    opacity: 0.5
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 3;
                nodeGroup.add(ring);

                nodeGroup.userData = {
                    index: idx,
                    id: nodeData.id,
                    baseRadius: radii[idx],
                    angle: (idx * Math.PI * 2) / 3,
                    speed: 0.005 + idx * 0.002,
                    data: nodeData
                };

                nodeMeshes.push(nodeGroup);
                orbitalGroup.add(nodeGroup);

                // Orbit Line
                const orbitCurve = new THREE.EllipseCurve(0, 0, radii[idx], radii[idx], 0, 2 * Math.PI, false, 0);
                const orbitPoints = orbitCurve.getPoints(64);
                const orbitLineGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints.map(p => new THREE.Vector3(p.x, 0, p.y)));
                const orbitLineMat = new THREE.LineBasicMaterial({
                    color: nodeData.color,
                    transparent: true,
                    opacity: 0.2
                });
                const orbitLine = new THREE.Line(orbitLineGeo, orbitLineMat);
                orbitRings.push(orbitLine);
                commandCenterGroup.add(orbitLine);

                // Signal Pulse Sphere
                const signalGeo = new THREE.SphereGeometry(0.045, 8, 8);
                const signalMat = new THREE.MeshBasicMaterial({
                    color: nodeData.color,
                    transparent: true,
                    opacity: 0.85
                });
                const signalMesh = new THREE.Mesh(signalGeo, signalMat);
                signalMesh.userData = { progress: idx * 0.33, speed: 0.005, radius: radii[idx] };
                dataPulseSignals.push(signalMesh);
                commandCenterGroup.add(signalMesh);
            });

            // 4. Background Holographic Atmospheric Particle Field
            if (tier !== 'low') {
                const bgCount = 220;
                totalParticleCount += bgCount;
                const bgGeo = new THREE.BufferGeometry();
                const bgPos = new Float32Array(bgCount * 3);
                for (let i = 0; i < bgCount * 3; i += 3) {
                    bgPos[i] = (Math.random() - 0.5) * 20;
                    bgPos[i + 1] = (Math.random() - 0.5) * 20;
                    bgPos[i + 2] = (Math.random() - 0.5) * 14 - 4;
                }
                bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
                const bgMat = new THREE.PointsMaterial({
                    color: 0x4f7cff,
                    size: 0.032,
                    transparent: true,
                    opacity: 0.45
                });
                starfieldParticles = new THREE.Points(bgGeo, bgMat);
                scene.add(starfieldParticles);
            }

            // Layout Adjustment for Portrait Safety and Clean Side-by-Side Positioning
            const defaultRadii = [2.4, 3.2, 4.0];
            function updateSceneLayout() {
                const width = window.innerWidth;
                const isLargeDesktop = width >= 1200;
                const isMediumDesktop = width >= 992 && width < 1200;
                const isTabletLayout = width >= 768 && width < 992;

                let sceneOffsetX = 0;
                let sceneOffsetY = 0;
                let camZ = 7.0;
                let targetRadii = [0.85, 1.15, 1.45];

                if (isLargeDesktop) {
                    sceneOffsetX = 4.2; // Right side on large desktop
                    sceneOffsetY = 0;
                    camZ = 7.0;
                    targetRadii = [0.85, 1.15, 1.45];
                } else if (isMediumDesktop) {
                    sceneOffsetX = -2.8; // Left side on medium desktop (1024px)
                    sceneOffsetY = 0;
                    camZ = 7.0;
                    targetRadii = [0.65, 0.9, 1.15];
                } else if (isTabletLayout) {
                    sceneOffsetX = 2.2;
                    sceneOffsetY = 0;
                    camZ = 7.2;
                    targetRadii = [0.9, 1.2, 1.5];
                } else {
                    sceneOffsetX = 0;
                    sceneOffsetY = -1.8;
                    camZ = 7.5;
                    targetRadii = [0.85, 1.1, 1.35];
                }

                if (commandCenterGroup) commandCenterGroup.position.set(sceneOffsetX, sceneOffsetY, 0);
                camera.position.set(0, 0.4, camZ);

                nodeMeshes.forEach((nodeGroup, idx) => {
                    if (nodeGroup && targetRadii[idx]) {
                        nodeGroup.userData.baseRadius = targetRadii[idx];
                        if (orbitRings[idx]) {
                            const scale = targetRadii[idx] / defaultRadii[idx];
                            orbitRings[idx].scale.set(scale, 1, scale);
                        }
                    }
                });
            }
            updateSceneLayout();

            // Pointer Movement listener for smooth camera parallax
            function onPointerMove(e) {
                if (reduceMotion) return;
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
                const width = container.clientWidth;
                const height = container.clientHeight;
                if (width === 0 || height === 0) return;

                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
                updateSceneLayout();
            }
            window.addEventListener('resize', onResize);

            // Observer for Off-screen Pausing
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    isPaused = !entry.isIntersecting;
                });
            }, { threshold: 0.1 });
            observer.observe(container);

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) isPaused = true;
                else if (container.getBoundingClientRect().bottom > 0) isPaused = false;
            });

            // Coordinate 3D Orbital Node Highlights with Portfolio Scroll Progression
            window.addEventListener('portfolio-section-active', (e) => {
                const sectionId = e.detail ? e.detail.sectionId : null;
                if (!sectionId) return;
                if (sectionId === 'projects') {
                    ObservatoryScene.selectNode(0);
                } else if (sectionId === 'skills' || sectionId === 'about') {
                    ObservatoryScene.selectNode(1);
                } else if (sectionId === 'certifications' || sectionId === 'experience') {
                    ObservatoryScene.selectNode(2);
                }
            });

            // Select Node API
            ObservatoryScene.selectNode = function (index) {
                if (index < 0 || index >= ObservatoryScene.nodesData.length) return;
                ObservatoryScene.activeNodeIndex = index;
                const targetNode = nodeMeshes[index];
                if (!targetNode) return;

                pointLightCyan.color.setHex(targetNode.userData.data.color);

                nodeMeshes.forEach((n, idx) => {
                    const scale = idx === index ? 1.35 : 1.0;
                    n.scale.set(scale, scale, scale);
                });

                window.dispatchEvent(new CustomEvent('observatory-node-change', {
                    detail: { index: index, data: targetNode.userData.data }
                }));
            };

            // Diagnostics and Portrait Intrusion Verification
            function checkPortraitIntrusions() {
                try {
                    const avatarEl = document.querySelector('.avatar-container') || document.querySelector('.profile-avatar') || document.querySelector('.glow-ring');
                    if (!avatarEl) return 0;
                    const rect = avatarEl.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) return 0;

                    let intrusions = 0;
                    const tempVec = new THREE.Vector3();

                    const canvasRect = renderer.domElement ? renderer.domElement.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
                    nodeMeshes.forEach(node => {
                        if (node && typeof node.getWorldPosition === 'function') {
                            node.getWorldPosition(tempVec);
                            tempVec.project(camera);

                            if (tempVec.z > 1) return; // Ignore nodes behind camera

                            const screenX = canvasRect.left + ((tempVec.x + 1) * canvasRect.width) / 2;
                            const screenY = canvasRect.top + ((-tempVec.y + 1) * canvasRect.height) / 2;

                            if (screenX >= rect.left - 10 && screenX <= rect.right + 10 &&
                                screenY >= rect.top - 10 && screenY <= rect.bottom + 10) {
                                intrusions++;
                            }
                        }
                    });

                    return intrusions;
                } catch (e) {
                    return 0;
                }
            }

            // Main Animation Loop
            let clock = new THREE.Clock();
            let isFailed = false;

            function animate() {
                if (isPaused || isFailed) return;

                try {
                    const elapsedTime = clock.getElapsedTime();

                    // Parallax camera damping
                    pointer.x += (pointer.targetX - pointer.x) * 0.05;
                    pointer.y += (pointer.targetY - pointer.y) * 0.05;

                    if (!reduceMotion) {
                        camera.position.x += (pointer.x * 0.35 - camera.position.x) * 0.05;
                        camera.position.y += (pointer.y * 0.25 - camera.position.y) * 0.05;
                    }

                    // Neural Core Rotations (Steady linear motion)
                    if (neuralCoreGroup) {
                        neuralCoreGroup.rotation.y = elapsedTime * 0.12;
                        neuralCoreGroup.rotation.x = elapsedTime * 0.04;
                    }

                    if (outerNeuralCage) {
                        outerNeuralCage.rotation.y = -elapsedTime * 0.08;
                    }

                    if (dataRingPrimary) {
                        dataRingPrimary.rotation.z = elapsedTime * 0.15;
                    }

                    if (dataRingSecondary) {
                        dataRingSecondary.rotation.z = -elapsedTime * 0.1;
                    }

                    // Orbital Satellites
                    nodeMeshes.forEach((nodeGroup) => {
                        const userData = nodeGroup.userData;
                        if (!reduceMotion) {
                            userData.angle += userData.speed;
                        }

                        const r = userData.baseRadius;
                        nodeGroup.position.x = Math.cos(userData.angle) * r;
                        nodeGroup.position.z = Math.sin(userData.angle) * r;
                        nodeGroup.position.y = Math.sin(userData.angle * 2) * 0.18;

                        nodeGroup.rotation.x += 0.008;
                        nodeGroup.rotation.y += 0.012;
                    });

                    // Signal pulses along orbits
                    dataPulseSignals.forEach((sig) => {
                        if (!reduceMotion) {
                            sig.userData.progress = (sig.userData.progress + sig.userData.speed) % 1;
                        }
                        const angle = sig.userData.progress * Math.PI * 2;
                        const r = sig.userData.radius;
                        sig.position.x = (commandCenterGroup.position.x || 0) + Math.cos(angle) * r;
                        sig.position.z = Math.sin(angle) * r;
                    });

                    renderer.render(scene, camera);

                    // Update Diagnostics window object
                    updateDiagnostics();

                    animationFrameId = requestAnimationFrame(animate);
                } catch (renderError) {
                    isFailed = true;
                    if (animationFrameId) cancelAnimationFrame(animationFrameId);
                    console.error('Three.js Observatory rendering encountered a fatal error:', renderError);
                    container.setAttribute('data-renderer-status', 'failed');
                    ObservatoryScene.status = 'failed';
                    renderStaticFallback(container);
                }
            }

            function updateDiagnostics() {
                try {
                    const intrusions = checkPortraitIntrusions();
                    const diag = {
                        rendererCount: 1,
                        qualityTier: tier || 'high',
                        objectCount: scene ? scene.children.length : 0,
                        particleCount: totalParticleCount || 400,
                        active: !isPaused && !isFailed,
                        reducedMotion: !!reduceMotion,
                        blinkingLights: 0,
                        portraitIntrusions: intrusions
                    };
                    window.__hero3dDiagnostics = diag;
                    ObservatoryScene.diagnostics = diag;
                } catch (e) {
                    console.warn('Diagnostics update error:', e);
                }
            }

            animate();

            container.setAttribute('data-renderer-status', 'ready');
            ObservatoryScene.status = 'ready';
            updateDiagnostics();

            ObservatoryScene.destroy = function () {
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('resize', onResize);
                if (renderer) {
                    renderer.dispose();
                    renderer.forceContextLoss();
                }
            };

        } catch (err) {
            console.error('Three.js Observatory initialization failed:', err);
            container.setAttribute('data-renderer-status', 'failed');
            ObservatoryScene.status = 'failed';
            renderStaticFallback(container);
        }
    }

    function renderStaticFallback(container) {
        if (!container.getAttribute('data-renderer-status') || container.getAttribute('data-renderer-status') === 'ready') {
            container.setAttribute('data-renderer-status', 'fallback');
            ObservatoryScene.status = 'fallback';
        } else {
            ObservatoryScene.status = container.getAttribute('data-renderer-status');
        }

        const fallbackCanvas = document.getElementById('hero-particles');
        if (fallbackCanvas) {
            fallbackCanvas.style.display = 'block';
        }

        const fallbackHTML = `
            <div class="observatory-static-fallback">
                <div class="static-prism-core">
                    <div class="static-prism-shape"></div>
                    <div class="static-core-pulse"></div>
                </div>
                <div class="static-orbit-ring ring-a"></div>
                <div class="static-orbit-ring ring-b"></div>
                <div class="static-nodes-wrapper">
                    <button class="static-node-item active" data-node-idx="0">
                        <span class="node-dot ai"></span>
                        <span class="node-title">AI & ML</span>
                    </button>
                    <button class="static-node-item" data-node-idx="1">
                        <span class="node-dot se"></span>
                        <span class="node-title">Software Eng</span>
                    </button>
                    <button class="static-node-item" data-node-idx="2">
                        <span class="node-dot aws"></span>
                        <span class="node-title">AWS & Cloud</span>
                    </button>
                </div>
            </div>
        `;
        const fallbackWrapper = document.createElement('div');
        fallbackWrapper.className = 'observatory-fallback-container';
        fallbackWrapper.innerHTML = fallbackHTML;
        container.appendChild(fallbackWrapper);

        const staticButtons = fallbackWrapper.querySelectorAll('.static-node-item');
        staticButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-node-idx'), 10);
                staticButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (ObservatoryScene.nodesData[idx]) {
                    window.dispatchEvent(new CustomEvent('observatory-node-change', {
                        detail: { index: idx, data: ObservatoryScene.nodesData[idx] }
                    }));
                }
            });
        });
    }

    ObservatoryScene.init = initObservatory;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initObservatory);
    } else {
        initObservatory();
    }
})();
