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
    let totalPublishedCerts = 26;
    const certToggleBtn = document.getElementById('cert-toggle-btn');
    const statCertCountEl = document.getElementById('stat-cert-count');

    function updateCertToggleBtnText() {
        if (certToggleBtn) {
            certToggleBtn.innerHTML = showAllCerts
                ? '<i class="fas fa-star"></i> Show Featured Only'
                : `<i class="fas fa-th-list"></i> View All ${totalPublishedCerts} Certificates`;
        }
    }

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

    function formatCertDate(dateStr) {
        if (!dateStr) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const parts = dateStr.split('-');
            const year = parts[0];
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const month = monthNames[parseInt(parts[1], 10) - 1];
            const day = parseInt(parts[2], 10);
            return `${month} ${day}, ${year}`;
        }
        return dateStr;
    }

    async function loadCertificatesFromJSON() {
        try {
            const res = await fetch('data/certificates.json');
            if (res.ok) {
                const certs = await res.json();
                if (certs && certs.length > 0 && certGrid) {
                    const publishedCerts = certs.filter(cert => cert.published !== false);
                    totalPublishedCerts = publishedCerts.length;

                    if (statCertCountEl) {
                        statCertCountEl.setAttribute('data-target', totalPublishedCerts);
                        statCertCountEl.textContent = totalPublishedCerts;
                    }

                    const emptyStateHTML = certEmptyState ? certEmptyState.outerHTML : '<div id="cert-empty-state" class="cert-empty-state" style="display: none;"><i class="fas fa-search-minus" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>No certificates found matching your search.</div>';

                    const cardsHTML = publishedCerts.map(cert => `
                        <div class="cert-card" data-category="${cert.category}" data-featured="${cert.featured}" ${cert.credentialId ? `data-credential-id="${cert.credentialId}"` : ''}>
                            <div class="cert-preview">
                                <img src="${cert.thumbnail}" alt="${cert.title} Certificate Preview" loading="lazy">
                                <div class="cert-overlay"><span class="expand-btn" role="button" aria-label="Expand certificate preview" tabindex="0"><i class="fas fa-expand"></i></span></div>
                            </div>
                            <div class="cert-body">
                                <h3>${cert.title}</h3>
                                <p class="cert-provider">${cert.issuer}</p>
                                ${cert.date ? `<p class="cert-date"><i class="fas fa-calendar-alt"></i> ${formatCertDate(cert.date)}</p>` : ''}
                                ${cert.expirationDate ? `<p class="cert-date cert-exp-date"><i class="fas fa-hourglass-end"></i> Expires: ${formatCertDate(cert.expirationDate)}</p>` : ''}
                                <div class="cert-actions">
                                    <a href="${cert.certificateFile}" target="_blank" rel="noopener noreferrer" class="cert-btn cert-btn-primary"><i class="fas fa-eye"></i> View Certificate</a>
                                    ${cert.verificationUrl ? `<a href="${cert.verificationUrl}" target="_blank" rel="noopener noreferrer" class="cert-btn cert-btn-outline"><i class="fas fa-check-circle"></i> Verify Credential</a>` : ''}
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

        updateCertToggleBtnText();
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
            updateCertToggleBtnText();
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



    /* ------------------------------------------------------------------
       5. AI-Themed Interactive Canvas Background
       ------------------------------------------------------------------ */
    const heroCanvas = document.getElementById('hero-particles');
    const heroSection = document.getElementById('hero');

    if (heroCanvas && heroCanvas.getContext) {
        const ctx = heroCanvas.getContext('2d');
        let animationFrameId = null;
        let isHeroVisible = true;
        let resizeTimeout = null;
        let width = 0;
        let height = 0;
        let mouseX = 0;
        let mouseY = 0;
        let targetMouseX = 0;
        let targetMouseY = 0;

        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        const resizeCanvas = () => {
            width = heroSection ? heroSection.offsetWidth : window.innerWidth;
            height = heroSection ? heroSection.offsetHeight : window.innerHeight;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            heroCanvas.width = width * dpr;
            heroCanvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        };

        resizeCanvas();

        const onResize = () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                resizeCanvas();
                if (mediaQuery.matches) {
                    renderFrame();
                }
            }, 100);
        };
        window.addEventListener('resize', onResize, { passive: true });

        if (heroSection) {
            heroSection.addEventListener('mousemove', (e) => {
                const rect = heroSection.getBoundingClientRect();
                targetMouseX = (e.clientX - rect.left) - width / 2;
                targetMouseY = (e.clientY - rect.top) - height / 2;
            }, { passive: true });
        }

        // Nodes & Network initialization (Reduced count on mobile for performance)
        const isMobile = window.innerWidth <= 768;
        const nodeCount = isMobile ? 18 : Math.min(Math.floor((width * height) / 24000), 36);
        const nodes = [];
        const labels = ['Python', 'AI', 'Machine Learning', 'LLM', 'Cloud', 'GitHub'];

        for (let i = 0; i < nodeCount; i++) {
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2 + 1.5,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: 0.02 + Math.random() * 0.03,
                label: i < labels.length ? labels[i] : null
            });
        }

        // Pulses along connections
        const pulses = [];
        const createPulse = (n1, n2) => {
            if (pulses.length < 8 && Math.random() < 0.03) {
                pulses.push({
                    from: n1,
                    to: n2,
                    progress: 0,
                    speed: 0.01 + Math.random() * 0.015
                });
            }
        };

        const stopAnimation = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        };

        const startAnimation = () => {
            if (!animationFrameId && isHeroVisible && !document.hidden && !mediaQuery.matches) {
                animationFrameId = requestAnimationFrame(renderFrame);
            }
        };

        const renderFrame = () => {
            ctx.clearRect(0, 0, width, height);

            // Smooth mouse interpolation
            mouseX += (targetMouseX - mouseX) * 0.05;
            mouseY += (targetMouseY - mouseY) * 0.05;

            // Draw Subtle Glowing Core
            const coreX = width / 2 + mouseX * 0.05;
            const coreY = height / 2 + mouseY * 0.05;
            const coreGradient = ctx.createRadialGradient(coreX, coreY, 10, coreX, coreY, Math.max(width, height) * 0.4);
            coreGradient.addColorStop(0, 'rgba(0, 229, 255, 0.07)');
            coreGradient.addColorStop(0.5, 'rgba(13, 148, 136, 0.03)');
            coreGradient.addColorStop(1, 'rgba(10, 15, 29, 0)');

            ctx.fillStyle = coreGradient;
            ctx.fillRect(0, 0, width, height);

            // Update & Draw Nodes
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (!mediaQuery.matches) {
                    node.x += node.vx;
                    node.y += node.vy;
                    node.pulse += node.pulseSpeed;

                    if (node.x < 0 || node.x > width) node.vx *= -1;
                    if (node.y < 0 || node.y > height) node.vy *= -1;
                }

                const currentRadius = node.radius + Math.sin(node.pulse) * 0.7;

                // Node Glow
                ctx.beginPath();
                ctx.arc(node.x, node.y, currentRadius * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
                ctx.fill();

                // Node Center
                ctx.beginPath();
                ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
                ctx.fillStyle = node.label ? '#00e5ff' : 'rgba(0, 229, 255, 0.7)';
                ctx.fill();

                // Label drawing
                if (node.label) {
                    ctx.font = '10px Inter, sans-serif';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
                    ctx.fillText(node.label, node.x + 8, node.y + 3);
                }

                // Connections
                for (let j = i + 1; j < nodes.length; j++) {
                    const other = nodes[j];
                    const dx = other.x - node.x;
                    const dy = other.y - node.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const maxDist = 140;

                    if (dist < maxDist) {
                        const alpha = (1 - dist / maxDist) * 0.25;
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();

                        if (!mediaQuery.matches) {
                            createPulse(node, other);
                        }
                    }
                }
            }

            // Signal Pulses
            for (let p = pulses.length - 1; p >= 0; p--) {
                const pulse = pulses[p];
                pulse.progress += pulse.speed;

                if (pulse.progress >= 1) {
                    pulses.splice(p, 1);
                    continue;
                }

                const px = pulse.from.x + (pulse.to.x - pulse.from.x) * pulse.progress;
                const py = pulse.from.y + (pulse.to.y - pulse.from.y) * pulse.progress;

                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            animationFrameId = null;
            if (isHeroVisible && !document.hidden && !mediaQuery.matches) {
                animationFrameId = requestAnimationFrame(renderFrame);
            }
        };

        // IntersectionObserver to pause off-screen animation
        if ('IntersectionObserver' in window && heroSection) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    isHeroVisible = entry.isIntersecting;
                    if (isHeroVisible) {
                        startAnimation();
                    } else {
                        stopAnimation();
                    }
                });
            }, { threshold: 0.05 });
            observer.observe(heroSection);
        }

        // Document visibility change listener
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAnimation();
            } else {
                startAnimation();
            }
        });

        if (!mediaQuery.matches) {
            startAnimation();
        } else {
            // Static single render for reduced motion
            renderFrame();
        }
    }

    /* ------------------------------------------------------------------
       6. AI-Assisted Introduction Modal Controller (Transcript-Only Preview)
       ------------------------------------------------------------------ */
    const btnOpenIntro = document.getElementById('btn-open-intro');
    const btnCloseIntro = document.getElementById('btn-close-intro');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const introModal = document.getElementById('ai-intro-modal');
    let previouslyFocusedElement = null;

    if (introModal && btnOpenIntro) {
        const openModal = () => {
            previouslyFocusedElement = (document.activeElement && document.activeElement !== document.body)
                ? document.activeElement
                : btnOpenIntro;
            introModal.hidden = false;
            introModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';

            if (btnCloseIntro) {
                btnCloseIntro.focus();
            } else {
                const container = introModal.querySelector('.modal-container');
                if (container) container.focus();
            }
        };

        const closeModal = () => {
            introModal.hidden = true;
            introModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';

            const elementToFocus = (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function')
                ? previouslyFocusedElement
                : btnOpenIntro;
            elementToFocus.focus();
        };

        btnOpenIntro.addEventListener('click', openModal);
        if (btnCloseIntro) btnCloseIntro.addEventListener('click', closeModal);
        if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

        // Escape Key & Focus Trap
        document.addEventListener('keydown', (e) => {
            if (introModal.hidden || introModal.getAttribute('aria-hidden') === 'true') return;

            if (e.key === 'Escape') {
                closeModal();
                return;
            }

            if (e.key === 'Tab') {
                const focusables = Array.from(introModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));
                if (focusables.length === 0) {
                    e.preventDefault();
                    return;
                }

                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === first || !introModal.contains(document.activeElement)) {
                        last.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === last || !introModal.contains(document.activeElement)) {
                        first.focus();
                        e.preventDefault();
                    }
                }
            }
        });
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
