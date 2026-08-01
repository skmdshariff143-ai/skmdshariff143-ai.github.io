/**
 * The AI Innovation Observatory — 3D Scene Module
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

        let scene, camera, renderer;
        let mainPrismGroup, outerWireframe, innerCorePoints, dataPulsesMesh;
        let orbitalGroup, nodeMeshes = [], orbitRings = [];
        let holographicPlatform, bgParticles;
        let ambientLight, pointLightCyan, pointLightViolet, directionalLight;
        let animationFrameId;
        let isPaused = false;
        let targetCameraPos = { x: 0, y: 0, z: 6.5 };
        let currentCameraPos = { x: 0, y: 0, z: 6.5 };
        let pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

        try {
            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x0c101d, 0.04);

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

            // Lighting Setup
            ambientLight = new THREE.AmbientLight(0x1a2638, 1.5);
            scene.add(ambientLight);

            pointLightCyan = new THREE.PointLight(0x00f2fe, 3.5, 12);
            pointLightCyan.position.set(-3, 2, 3);
            scene.add(pointLightCyan);

            pointLightViolet = new THREE.PointLight(0x7f00ff, 3.5, 12);
            pointLightViolet.position.set(3, -2, 2);
            scene.add(pointLightViolet);

            directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
            directionalLight.position.set(0, 5, 5);
            scene.add(directionalLight);

            // 1. Central Crystalline Neural Prism
            mainPrismGroup = new THREE.Group();
            scene.add(mainPrismGroup);

            // Outer Prism Mesh
            const prismGeo = new THREE.IcosahedronGeometry(1.3, 0);
            const prismMat = new THREE.MeshPhysicalMaterial({
                color: 0x0c1e38,
                metalness: 0.2,
                roughness: 0.1,
                transmission: 0.6,
                ior: 1.4,
                transparent: true,
                opacity: 0.85,
                reflectivity: 0.9,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1
            });
            const outerPrism = new THREE.Mesh(prismGeo, prismMat);
            mainPrismGroup.add(outerPrism);

            // Outer Wireframe Accent
            const wireGeo = new THREE.WireframeGeometry(prismGeo);
            const wireMat = new THREE.LineBasicMaterial({
                color: 0x00f2fe,
                transparent: true,
                opacity: 0.4
            });
            outerWireframe = new THREE.LineSegments(wireGeo, wireMat);
            mainPrismGroup.add(outerWireframe);

            // Inner Neural Point Cloud
            const pointCount = tier === 'high' ? 450 : 250;
            const pointsGeo = new THREE.BufferGeometry();
            const positions = new Float32Array(pointCount * 3);
            const colors = new Float32Array(pointCount * 3);
            const color1 = new THREE.Color(0x00f2fe);
            const color2 = new THREE.Color(0x7f00ff);

            for (let i = 0; i < pointCount; i++) {
                // Sphere distribution within radius 0.95
                const u = Math.random();
                const r = Math.cbrt(u) * 0.95;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);

                const x = r * Math.sin(phi) * Math.cos(theta);
                const y = r * Math.sin(phi) * Math.sin(theta);
                const z = r * Math.cos(phi);

                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;

                const mixedColor = color1.clone().lerp(color2, Math.random());
                colors[i * 3] = mixedColor.r;
                colors[i * 3 + 1] = mixedColor.g;
                colors[i * 3 + 2] = mixedColor.b;
            }

            pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            pointsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const pointsMat = new THREE.PointsMaterial({
                size: 0.04,
                vertexColors: true,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending
            });
            innerCorePoints = new THREE.Points(pointsGeo, pointsMat);
            mainPrismGroup.add(innerCorePoints);

            // Flowing Data Pulses (Inner core connections)
            const pulseLinesGeo = new THREE.BufferGeometry();
            const pulsePositions = [];
            for (let i = 0; i < pointCount; i += 3) {
                if (i + 1 < pointCount) {
                    pulsePositions.push(
                        positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
                        positions[(i + 1) * 3], positions[(i + 1) * 3 + 1], positions[(i + 1) * 3 + 2]
                    );
                }
            }
            pulseLinesGeo.setAttribute('position', new THREE.Float32BufferAttribute(pulsePositions, 3));
            const pulseLinesMat = new THREE.LineBasicMaterial({
                color: 0x00f5a0,
                transparent: true,
                opacity: 0.25,
                blending: THREE.AdditiveBlending
            });
            dataPulsesMesh = new THREE.LineSegments(pulseLinesGeo, pulseLinesMat);
            mainPrismGroup.add(dataPulsesMesh);

            // 2. Three Interactive Orbital Evidence Nodes
            orbitalGroup = new THREE.Group();
            scene.add(orbitalGroup);

            const radii = [2.4, 3.2, 4.0];
            const nodeGeometries = [
                new THREE.OctahedronGeometry(0.28, 0),
                new THREE.TetrahedronGeometry(0.26, 0),
                new THREE.DodecahedronGeometry(0.25, 0)
            ];

            ObservatoryScene.nodesData.forEach((nodeData, idx) => {
                const nodeGroup = new THREE.Group();

                // Core Node Mesh
                const nodeMat = new THREE.MeshStandardMaterial({
                    color: nodeData.color,
                    emissive: nodeData.color,
                    emissiveIntensity: 0.8,
                    metalness: 0.8,
                    roughness: 0.2
                });
                const mesh = new THREE.Mesh(nodeGeometries[idx], nodeMat);
                nodeGroup.add(mesh);

                // Orbital Ring accent for node
                const ringGeo = new THREE.TorusGeometry(0.42, 0.015, 8, 32);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: nodeData.color,
                    transparent: true,
                    opacity: 0.6
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 3;
                nodeGroup.add(ring);

                // Attach metadata
                nodeGroup.userData = {
                    index: idx,
                    id: nodeData.id,
                    baseRadius: radii[idx],
                    angle: (idx * Math.PI * 2) / 3,
                    speed: 0.008 + idx * 0.003,
                    data: nodeData
                };

                nodeMeshes.push(nodeGroup);
                orbitalGroup.add(nodeGroup);

                // Path Orbit Ring Line
                const pathGeo = new THREE.RingGeometry(radii[idx] - 0.01, radii[idx] + 0.01, 64);
                const pathMat = new THREE.MeshBasicMaterial({
                    color: nodeData.color,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.15
                });
                const pathMesh = new THREE.Mesh(pathGeo, pathMat);
                pathMesh.rotation.x = Math.PI / 2.2;
                orbitRings.push(pathMesh);
                scene.add(pathMesh);
            });

            // 3. Holographic Platform
            const gridGeo = new THREE.RingGeometry(0.8, 4.5, 64, 4);
            const gridMat = new THREE.MeshBasicMaterial({
                color: 0x00f2fe,
                wireframe: true,
                transparent: true,
                opacity: 0.08
            });
            holographicPlatform = new THREE.Mesh(gridGeo, gridMat);
            holographicPlatform.rotation.x = -Math.PI / 2;
            holographicPlatform.position.y = -2.2;
            scene.add(holographicPlatform);

            // 4. Subtle Background Star/Dust Field
            if (tier !== 'low') {
                const bgCount = 200;
                const bgGeo = new THREE.BufferGeometry();
                const bgPos = new Float32Array(bgCount * 3);
                for (let i = 0; i < bgCount * 3; i += 3) {
                    bgPos[i] = (Math.random() - 0.5) * 20;
                    bgPos[i + 1] = (Math.random() - 0.5) * 20;
                    bgPos[i + 2] = (Math.random() - 0.5) * 15 - 5;
                }
                bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
                const bgMat = new THREE.PointsMaterial({
                    color: 0x7f00ff,
                    size: 0.03,
                    transparent: true,
                    opacity: 0.4
                });
                bgParticles = new THREE.Points(bgGeo, bgMat);
                scene.add(bgParticles);
            }

            // Pointer Movement listener for smooth camera parallax
            function onPointerMove(e) {
                const rect = container.getBoundingClientRect();
                if (e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    pointer.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
                    pointer.targetY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
                }
            }
            window.addEventListener('pointermove', onPointerMove, { passive: true });

            // Resize Handler
            function onResize() {
                if (!container || !renderer || !camera) return;
                const width = container.clientWidth;
                const height = container.clientHeight;
                if (width === 0 || height === 0) return;

                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
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

            // Select Orbital Node API
            ObservatoryScene.selectNode = function (index) {
                if (index < 0 || index >= ObservatoryScene.nodesData.length) return;
                ObservatoryScene.activeNodeIndex = index;
                const targetNode = nodeMeshes[index];
                if (!targetNode) return;

                // Shift dynamic light accent to active node color
                const nodeData = targetNode.userData.data;
                pointLightCyan.color.setHex(nodeData.color);

                // Scale up selected node briefly
                nodeMeshes.forEach((n, idx) => {
                    const scale = idx === index ? 1.45 : 1.0;
                    n.scale.set(scale, scale, scale);
                });

                // Dispatch event for UI listeners
                window.dispatchEvent(new CustomEvent('observatory-node-change', {
                    detail: { index: index, data: nodeData }
                }));
            };

            // Main Animation Loop
            let clock = new THREE.Clock();
            function animate() {
                animationFrameId = requestAnimationFrame(animate);
                if (isPaused) return;

                const elapsedTime = clock.getElapsedTime();

                // Smooth Camera Parallax Damping
                pointer.x += (pointer.targetX - pointer.x) * 0.05;
                pointer.y += (pointer.targetY - pointer.y) * 0.05;

                camera.position.x = currentCameraPos.x + pointer.x * 0.6;
                camera.position.y = currentCameraPos.y + pointer.y * 0.4;
                camera.lookAt(0, 0, 0);

                // Central Prism Rotations
                if (mainPrismGroup) {
                    mainPrismGroup.rotation.y = elapsedTime * 0.25;
                    mainPrismGroup.rotation.x = Math.sin(elapsedTime * 0.15) * 0.15;
                }

                if (outerWireframe) {
                    outerWireframe.rotation.y = -elapsedTime * 0.1;
                }

                if (innerCorePoints) {
                    innerCorePoints.rotation.y = elapsedTime * 0.4;
                }

                // Orbital Node Animations
                nodeMeshes.forEach((nodeGroup) => {
                    const userData = nodeGroup.userData;
                    userData.angle += userData.speed;

                    const r = userData.baseRadius;
                    nodeGroup.position.x = Math.cos(userData.angle) * r;
                    nodeGroup.position.z = Math.sin(userData.angle) * r;
                    nodeGroup.position.y = Math.sin(userData.angle * 2 + elapsedTime) * 0.25;

                    nodeGroup.rotation.x += 0.01;
                    nodeGroup.rotation.y += 0.02;
                });

                if (holographicPlatform) {
                    holographicPlatform.rotation.z = elapsedTime * 0.05;
                }

                renderer.render(scene, camera);
            }

            animate();

            // Set Ready Status
            container.setAttribute('data-renderer-status', 'ready');
            ObservatoryScene.status = 'ready';

            // Clean-up API
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
            console.warn('Three.js Observatory init error:', err);
            renderStaticFallback(container);
        }
    }

    function renderStaticFallback(container) {
        container.setAttribute('data-renderer-status', 'fallback');
        ObservatoryScene.status = 'fallback';

        const fallbackCanvas = document.getElementById('hero-particles');
        if (fallbackCanvas) {
            fallbackCanvas.style.display = 'block';
        }

        // Render elegant CSS/SVG diagram of AI Innovation Observatory
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

        // Bind static fallback click listeners
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
