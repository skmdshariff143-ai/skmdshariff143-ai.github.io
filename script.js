document.addEventListener('DOMContentLoaded', () => {
    /* ----------------------------------------------------------------------
       Mobile Navigation Toggle
       ---------------------------------------------------------------------- */
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            const isActive = navLinks.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', isActive ? 'true' : 'false');

            // Toggle hamburger icon (bars to times)
            const icon = hamburger.querySelector('i');
            if (icon) {
                if (isActive) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close menu when a link is clicked
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                const icon = hamburger.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

    /* ----------------------------------------------------------------------
       Sticky Navbar & Active Link Highlight on Scroll
       ---------------------------------------------------------------------- */
    const navbar = document.querySelector('.navbar');
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        // Sticky Navbar styling
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
                navbar.style.background = 'rgba(10, 10, 10, 0.95)';
            } else {
                navbar.style.boxShadow = 'none';
                navbar.style.background = 'rgba(10, 10, 10, 0.8)';
            }
        }

        // Active Link Highlight
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            const href = item.getAttribute('href');
            if (href && href.includes(current) && current !== '') {
                item.classList.add('active');
            }
        });
    });

    /* ----------------------------------------------------------------------
       Scroll Reveal Animations (Intersection Observer)
       ---------------------------------------------------------------------- */
    const revealElements = document.querySelectorAll('.card, .cert-card, .section-title, .about-text, .about-stats, .timeline-item, .lang-card');

    // Initial state setup for animation
    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    /* ------------------------------------------------------------------
       Certificate System: Dynamic Load, Filtering, Search & Modal
       ------------------------------------------------------------------ */
    const certModal = document.getElementById('cert-modal');
    const certModalImg = document.getElementById('cert-modal-img');
    const certModalClose = document.getElementById('cert-modal-close');
    const certGrid = document.querySelector('.cert-grid');
    const filterBtns = document.querySelectorAll('.cert-filters .filter-btn');
    const certSearchInput = document.getElementById('cert-search-input');
    const certCountNum = document.getElementById('cert-count-num');
    let certEmptyState = document.getElementById('cert-empty-state');

    let activeFilter = 'all';
    let searchQuery = '';
    let lastFocusedElement = null;

    function openCertModal(src, alt) {
        if (certModal && certModalImg) {
            lastFocusedElement = document.activeElement;
            certModalImg.src = src;
            certModalImg.alt = alt || 'Certificate Preview';
            certModal.classList.add('active');
            certModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            if (certModalClose) certModalClose.focus();
        }
    }

    function closeCertModal() {
        if (certModal) {
            certModal.classList.remove('active');
            certModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
                lastFocusedElement.focus();
            }
        }
    }

    function bindCertModalEvents() {
        document.querySelectorAll('.cert-preview').forEach(preview => {
            if (!preview.dataset.modalBound) {
                preview.dataset.modalBound = 'true';
                const img = preview.querySelector('img');
                const triggerModal = () => {
                    if (img) openCertModal(img.src, img.alt);
                };
                preview.addEventListener('click', triggerModal);

                const expandBtn = preview.querySelector('.expand-btn');
                if (expandBtn) {
                    expandBtn.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            triggerModal();
                        }
                    });
                }
            }
        });
    }

    if (certModalClose) {
        certModalClose.addEventListener('click', closeCertModal);
    }

    if (certModal) {
        certModal.addEventListener('click', (e) => {
            if (e.target === certModal) {
                closeCertModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && certModal && certModal.classList.contains('active')) {
            closeCertModal();
        }
    });

    let showAllCerts = false;
    const certToggleBtn = document.getElementById('cert-toggle-btn');

    function applyCertFilters() {
        const certCards = document.querySelectorAll('#certificates .cert-card');
        let visibleCount = 0;

        certCards.forEach(card => {
            const category = card.dataset.category || 'all';
            const isFeatured = card.dataset.featured === 'true';
            const titleEl = card.querySelector('h3');
            const providerEl = card.querySelector('.cert-provider');
            const cardText = ((titleEl ? titleEl.textContent : '') + ' ' + (providerEl ? providerEl.textContent : '')).toLowerCase();

            const matchesCategory = (activeFilter === 'all' || category === activeFilter);
            const matchesSearch = (!searchQuery || cardText.includes(searchQuery));
            const matchesVisibility = (showAllCerts || activeFilter !== 'all' || searchQuery !== '' || isFeatured);

            if (matchesCategory && matchesSearch && matchesVisibility) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (certCountNum) {
            certCountNum.textContent = visibleCount;
        }

        if (certEmptyState) {
            certEmptyState.style.display = (visibleCount === 0) ? 'block' : 'none';
        }
    }

    async function loadCertificatesFromJSON() {
        try {
            const res = await fetch('data/certificates.json');
            if (res.ok) {
                const certs = await res.json();
                if (certs && certs.length > 0 && certGrid) {
                    const emptyStateHTML = certEmptyState ? certEmptyState.outerHTML : '<div id="cert-empty-state" class="cert-empty-state" style="display: none;"><i class="fas fa-search-minus" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>No certificates found matching your search.</div>';

                    const cardsHTML = certs.map(cert => `
                        <div class="cert-card" data-category="${cert.category}" data-featured="${cert.featured}">
                            <div class="cert-preview">
                                <img src="${cert.thumbnail}" alt="${cert.title} Certificate Preview" loading="lazy">
                                <div class="cert-overlay"><span class="expand-btn" role="button" aria-label="Expand certificate preview" tabindex="0"><i class="fas fa-expand"></i></span></div>
                            </div>
                            <div class="cert-body">
                                <h3>${cert.title}</h3>
                                <p class="cert-provider">${cert.issuer}</p>
                                ${cert.date ? `<p class="cert-date"><i class="fas fa-calendar-alt"></i> ${cert.date}</p>` : ''}
                                <div class="cert-actions">
                                    <a href="${cert.certificateFile}" target="_blank" rel="noopener noreferrer" class="cert-btn cert-btn-primary"><i class="fas fa-eye"></i> View Certificate</a>
                                </div>
                            </div>
                        </div>
                    `).join('');

                    certGrid.innerHTML = emptyStateHTML + cardsHTML;
                    const newEmptyState = document.getElementById('cert-empty-state');
                    if (newEmptyState) {
                        certEmptyState = newEmptyState;
                    }
                }
            }
        } catch (err) {
            console.warn('Dynamic fetch for certificates.json skipped or failed; using static fallback', err);
        }

        bindCertModalEvents();
        applyCertFilters();
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            applyCertFilters();
        });
    });

    if (certSearchInput) {
        certSearchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            applyCertFilters();
        });
    }

    if (certToggleBtn) {
        certToggleBtn.addEventListener('click', () => {
            showAllCerts = !showAllCerts;
            certToggleBtn.innerHTML = showAllCerts
                ? '<i class="fas fa-star"></i> Show Featured Only'
                : '<i class="fas fa-th-list"></i> View All 25 Certificates';
            applyCertFilters();
        });
    }

    loadCertificatesFromJSON();
    /* ------------------------------------------------------------------
       3D & Creative Effects
       ------------------------------------------------------------------ */

    // 1. Custom Cursor Follower
    const cursorGlow = document.getElementById('cursor-glow');
    if (cursorGlow) {
        document.addEventListener('mousemove', (e) => {
            cursorGlow.style.left = e.clientX + 'px';
            cursorGlow.style.top = e.clientY + 'px';
            if (!cursorGlow.classList.contains('visible')) {
                cursorGlow.classList.add('visible');
            }
        });
        document.addEventListener('mouseleave', () => {
            cursorGlow.classList.remove('visible');
        });
    }

    // 2. Typing Effect for Tagline
    const taglineEl = document.getElementById('typed-tagline');
    if (taglineEl) {
        const textToType = "Passionate about applying data-driven approaches to solve real-world problems and building efficient software solutions.";
        let i = 0;
        taglineEl.textContent = '';
        function typeWriter() {
            if (i < textToType.length) {
                taglineEl.textContent += textToType.charAt(i);
                i++;
                setTimeout(typeWriter, 30);
            }
        }
        setTimeout(typeWriter, 500); // Start after a small delay
    }

    // 3. Counter Animation (Integration with Intersection Observer)
    const counters = document.querySelectorAll('.counter');
    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseFloat(entry.target.getAttribute('data-target'));
                const isDecimal = entry.target.hasAttribute('data-decimal');
                const duration = 2000; // ms
                const stepTime = 20; // ms
                const steps = duration / stepTime;
                const increment = target / steps;

                // Start animation from 0 when visible; otherwise HTML default remains
                let current = 0;

                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    entry.target.textContent = isDecimal ? current.toFixed(2) : Math.floor(current);
                }, stepTime);

                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));

    // 4. 3D Tilt Effect for Cards
    const tiltCards = document.querySelectorAll('.tilt-card, .cert-card, .project-card, .lang-card');
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10; // Max rotation 10deg
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });

    // Helper to check WebGL support
    const hasWebGLSupport = (canvasEl) => {
        try {
            if (!canvasEl || !window.WebGLRenderingContext) return false;
            return !!(canvasEl.getContext('webgl') || canvasEl.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    };

    // 5. Three.js Particle Background
    const canvas = document.getElementById('hero-particles');

    // Check if browser supports WebGL before continuing
    if (canvas && hasWebGLSupport(canvas)) {
        let attempts = 0;
        const maxAttempts = 50; // Wait maximum 5 seconds (50 * 100ms)

        // Wait for Three.js to load since it's deferred
        const initThree = () => {
            if (typeof THREE === 'undefined' || !window.THREE) {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(initThree, 100);
                } else {
                    console.warn("Three.js failed to load within timeout. Skipping particle background.");
                }
                return;
            }

            try {
                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });

                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

                const particlesGeometry = new THREE.BufferGeometry();
                const particlesCount = 300;
                const posArray = new Float32Array(particlesCount * 3);

                for (let i = 0; i < particlesCount * 3; i++) {
                    posArray[i] = (Math.random() - 0.5) * 10;
                }

                particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

                const particlesMaterial = new THREE.PointsMaterial({
                    size: 0.02,
                    color: 0x00e5ff,
                    transparent: true,
                    opacity: 0.5,
                    blending: THREE.AdditiveBlending
                });

                const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
                scene.add(particlesMesh);

                camera.position.z = 3;

                let mouseX = 0;
                let mouseY = 0;
                let targetX = 0;
                let targetY = 0;
                let windowHalfX = window.innerWidth / 2;
                let windowHalfY = window.innerHeight / 2;

                document.addEventListener('mousemove', (event) => {
                    mouseX = (event.clientX - windowHalfX);
                    mouseY = (event.clientY - windowHalfY);
                });

                const clock = new THREE.Clock();

                function animate() {
                    requestAnimationFrame(animate);

                    targetX = mouseX * 0.001;
                    targetY = mouseY * 0.001;

                    particlesMesh.rotation.y += 0.001;
                    particlesMesh.rotation.x += 0.0005;

                    particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
                    particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);

                    renderer.render(scene, camera);
                }

                animate();

                window.addEventListener('resize', () => {
                    windowHalfX = window.innerWidth / 2;
                    windowHalfY = window.innerHeight / 2;
                    camera.aspect = window.innerWidth / window.innerHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(window.innerWidth, window.innerHeight);
                });
            } catch (error) {
                console.error("Error initializing Three.js particle background:", error);
            }
        };
        initThree();
    }

    /* ------------------------------------------------------------------
       Contact Form Submission (Formspree AJAX)
       ------------------------------------------------------------------ */
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Show sending status
            if (formStatus) {
                formStatus.style.display = 'block';
                formStatus.style.color = 'var(--text-secondary)';
                formStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending message...';
            }

            const data = new FormData(contactForm);

            try {
                const response = await fetch(contactForm.action, {
                    method: contactForm.method,
                    body: data,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    contactForm.reset();
                    contactForm.innerHTML = `
                        <div class="form-success-message">
                            <i class="fas fa-check-circle"></i>
                            <h3>Message Sent!</h3>
                            <p>Thanks! Your message has been sent — I'll get back to you soon.</p>
                        </div>
                    `;
                } else {
                    if (formStatus) {
                        formStatus.style.color = '#ff1744'; // error red
                        formStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Oops! Something went wrong. Please try emailing me directly at <a href="mailto:23BQ1A04F2@vvit.net" style="color: var(--accent-teal); text-decoration: underline;">23BQ1A04F2@vvit.net</a> instead.';
                    }
                }
            } catch (error) {
                if (formStatus) {
                    formStatus.style.color = '#ff1744';
                    formStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Connection error. Please try emailing me directly at <a href="mailto:23BQ1A04F2@vvit.net" style="color: var(--accent-teal); text-decoration: underline;">23BQ1A04F2@vvit.net</a> instead.';
                }
            }
        });
    }
});
