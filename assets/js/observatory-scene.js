/**
 * The AI Innovation Observatory — 3D Scene Module ("AI Systems Constellation")
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
                color: 0x00f2fe,
                accentHex: '#00f2fe',
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
                color: 0x00f5a0,
                accentHex: '#00f5a0',
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
                color: 0xffb703,
                accentHex: '#ffb703',
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
        let mainConstellationGroup, innerFacetedCore, outerWireframeShell, dataHaloRing;
        let orbitalGroup, nodeMeshes = [], orbitRings = [];
        let circuitGrid, starfieldParticles, dataPulseSignals = [];
        let ambientLight, pointLightCyan, pointLightViolet, directionalLight;
        let animationFrameId;
        let isPaused = false;
        let totalParticleCount = 0;
        let pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

        try {
            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x0c101d, 0.035);

            const aspect = container.clientWidth / container.clientHeight || 1;
            camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
            camera.position.set(0, 0.5, 6.5);

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
            renderer.toneMappingExposure = 1.2;

            // STABLE CONSTANT LIGHTING SETUP (No intensity oscillation)
            ambientLight = new THREE.AmbientLight(0x1a2638, 1.5);
            scene.add(ambientLight);

            pointLightCyan = new THREE.PointLight(0x00f2fe, 3.0, 12);
            pointLightCyan.position.set(-3, 2, 3);
            scene.add(pointLightCyan);

            pointLightViolet = new THREE.PointLight(0x7f00ff, 3.0, 12);
            pointLightViolet.position.set(3, -2, 2);
            scene.add(pointLightViolet);

            directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
            directionalLight.position.set(0, 5, 5);
            scene.add(directionalLight);

            // 1. Central AI Intelligence Structure
            mainConstellationGroup = new THREE.Group();
            scene.add(mainConstellationGroup);

            // Inner Faceted Metallic Core
            const coreGeo = new THREE.IcosahedronGeometry(1.1, 0);
            const coreMat = new THREE.MeshStandardMaterial({
                color: 0x0a1628,
                metalness: 0.85,
                roughness: 0.2,
                emissive: 0x00f2fe,
                emissiveIntensity: 0.15
            });
            innerFacetedCore = new THREE.Mesh(coreGeo, coreMat);
            mainConstellationGroup.add(innerFacetedCore);

            // Cyan Wireframe Intelligence Shell
            const shellGeo = new THREE.IcosahedronGeometry(1.4, 1);
            const shellMat = new THREE.MeshBasicMaterial({
                color: 0x00f2fe,
                wireframe: true,
                transparent: true,
                opacity: 0.35
            });
            outerWireframeShell = new THREE.Mesh(shellGeo, shellMat);
            mainConstellationGroup.add(outerWireframeShell);

            // Thin Data Halo Ring
            const haloGeo = new THREE.TorusGeometry(1.85, 0.015, 16, 64);
            const haloMat = new THREE.MeshBasicMaterial({
                color: 0x00e5ff,
                transparent: true,
                opacity: 0.5
            });
            dataHaloRing = new THREE.Mesh(haloGeo, haloMat);
            dataHaloRing.rotation.x = Math.PI / 3;
            mainConstellationGroup.add(dataHaloRing);

            // Inner Core Point Cloud
            const corePointCount = tier === 'high' ? 300 : 150;
            totalParticleCount += corePointCount;
            const pointsGeo = new THREE.BufferGeometry();
            const positions = new Float32Array(corePointCount * 3);
            for (let i = 0; i < corePointCount * 3; i += 3) {
                const r = 0.9 * Math.cbrt(Math.random());
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                positions[i] = r * Math.sin(phi) * Math.cos(theta);
                positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
                positions[i + 2] = r * Math.cos(phi);
            }
            pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const pointsMat = new THREE.PointsMaterial({
                color: 0x00f2fe,
                size: 0.035,
                transparent: true,
                opacity: 0.8
            });
            const innerPointsMesh = new THREE.Points(pointsGeo, pointsMat);
            mainConstellationGroup.add(innerPointsMesh);

            // 2. Three Technical Domain Satellites (Distinct Procedural Geometries)
            orbitalGroup = new THREE.Group();
            scene.add(orbitalGroup);

            const isDesktop = window.innerWidth >= 992;
            const radii = isDesktop ? [2.5, 3.3, 4.1] : [1.9, 2.4, 2.9];

            const nodeGeometries = [
                new THREE.OctahedronGeometry(0.32, 0),    // AI & ML
                new THREE.BoxGeometry(0.42, 0.42, 0.42),   // Software Eng
                new THREE.DodecahedronGeometry(0.3, 0)     // AWS & Cloud
            ];

            ObservatoryScene.nodesData.forEach((nodeData, idx) => {
                const nodeGroup = new THREE.Group();

                // Core Satellite Mesh
                const nodeMat = new THREE.MeshStandardMaterial({
                    color: nodeData.color,
                    emissive: nodeData.color,
                    emissiveIntensity: 0.7,
                    metalness: 0.8,
                    roughness: 0.2
                });
                const mesh = new THREE.Mesh(nodeGeometries[idx], nodeMat);
                nodeGroup.add(mesh);

                // Accent Ring
                const ringGeo = new THREE.TorusGeometry(0.48, 0.01, 8, 32);
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
                    speed: 0.006 + idx * 0.002,
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
                    opacity: 0.15
                });
                const orbitLine = new THREE.Line(orbitLineGeo, orbitLineMat);
                orbitRings.push(orbitLine);
                scene.add(orbitLine);

                // Signal Pulse along connection line
                const signalGeo = new THREE.SphereGeometry(0.04, 8, 8);
                const signalMat = new THREE.MeshBasicMaterial({
                    color: nodeData.color,
                    transparent: true,
                    opacity: 0.8
                });
                const signalMesh = new THREE.Mesh(signalGeo, signalMat);
                signalMesh.userData = { progress: idx * 0.33, speed: 0.005, radius: radii[idx] };
                dataPulseSignals.push(signalMesh);
                scene.add(signalMesh);
            });

            // 3. Perspective Circuit Plane / Grid Helper
            circuitGrid = new THREE.GridHelper(12, 24, 0x00f2fe, 0x0c2038);
            circuitGrid.position.y = -2.2;
            circuitGrid.material.transparent = true;
            circuitGrid.material.opacity = 0.12;
            scene.add(circuitGrid);

            // 4. Starfield Atmosphere
            if (tier !== 'low') {
                const bgCount = 180;
                totalParticleCount += bgCount;
                const bgGeo = new THREE.BufferGeometry();
                const bgPos = new Float32Array(bgCount * 3);
                for (let i = 0; i < bgCount * 3; i += 3) {
                    bgPos[i] = (Math.random() - 0.5) * 18;
                    bgPos[i + 1] = (Math.random() - 0.5) * 18;
                    bgPos[i + 2] = (Math.random() - 0.5) * 12 - 4;
                }
                bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
                const bgMat = new THREE.PointsMaterial({
                    color: 0x7f00ff,
                    size: 0.03,
                    transparent: true,
                    opacity: 0.4
                });
                starfieldParticles = new THREE.Points(bgGeo, bgMat);
                scene.add(starfieldParticles);
            }

            // Layout Adjustment for Portrait Safety
            const defaultRadii = [2.5, 3.3, 4.1];
            function updateSceneLayout() {
                const width = container.clientWidth;
                const isDesktopLayout = width >= 992;
                const isTabletLayout = width >= 768 && width < 992;

                let sceneOffsetX = 0;
                let sceneOffsetY = 0;
                let camZ = 7.2;
                let targetRadii = [1.9, 2.4, 2.9];

                if (isDesktopLayout) {
                    sceneOffsetX = -2.8;
                    sceneOffsetY = 0;
                    camZ = 6.6;
                    targetRadii = [1.8, 2.3, 2.8];
                } else if (isTabletLayout) {
                    sceneOffsetX = -1.8;
                    sceneOffsetY = 0;
                    camZ = 7.2;
                    targetRadii = [1.5, 2.0, 2.5];
                } else {
                    sceneOffsetX = 0;
                    sceneOffsetY = -1.8;
                    camZ = 7.5;
                    targetRadii = [1.1, 1.4, 1.7];
                }

                if (mainConstellationGroup) mainConstellationGroup.position.set(sceneOffsetX, sceneOffsetY, 0);
                if (orbitalGroup) orbitalGroup.position.set(sceneOffsetX, sceneOffsetY, 0);
                orbitRings.forEach(r => r.position.set(sceneOffsetX, sceneOffsetY, 0));
                if (circuitGrid) circuitGrid.position.set(sceneOffsetX, -2.2 + sceneOffsetY, 0);
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
                    const scale = idx === index ? 1.4 : 1.0;
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

                    nodeMeshes.forEach(node => {
                        if (node && typeof node.getWorldPosition === 'function') {
                            node.getWorldPosition(tempVec);
                            tempVec.project(camera);

                            const screenX = ((tempVec.x + 1) * window.innerWidth) / 2;
                            const screenY = ((-tempVec.y + 1) * window.innerHeight) / 2;

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
                        camera.position.x += (pointer.x * 0.4 - camera.position.x) * 0.05;
                        camera.position.y += (pointer.y * 0.3 - camera.position.y) * 0.05;
                    }

                    // Central Constellation Rotations (Steady linear time)
                    if (mainConstellationGroup) {
                        mainConstellationGroup.rotation.y = elapsedTime * 0.12;
                        mainConstellationGroup.rotation.x = elapsedTime * 0.05;
                    }

                    if (outerWireframeShell) {
                        outerWireframeShell.rotation.y = -elapsedTime * 0.08;
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
                        sig.position.x = (orbitalGroup.position.x || 0) + Math.cos(angle) * r;
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
