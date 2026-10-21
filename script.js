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
                ? '<i class="fas fa-chevron-up"></i> Show Less'
                : `<i class="fas fa-th-list"></i> Show All Certifications (${totalPublishedCerts})`;
            certToggleBtn.setAttribute('aria-expanded', showAllCerts ? 'true' : 'false');
        }
    }

    function applyCertFilters() {
        const certCards = document.querySelectorAll('#certificates .cert-card');
        let matchingCount = 0;

        certCards.forEach(card => {
            const category = card.dataset.category || 'all';
            const titleEl = card.querySelector('h3');
            const providerEl = card.querySelector('.cert-provider');
            const cardText = ((titleEl ? titleEl.textContent : '') + ' ' + (providerEl ? providerEl.textContent : '')).toLowerCase();

            const matchesCategory = (activeFilter === 'all' || category === activeFilter);
            const matchesSearch = (!searchQuery || cardText.includes(searchQuery));

            if (matchesCategory && matchesSearch) {
                matchingCount++;
                if (showAllCerts || matchingCount <= 9) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            } else {
                card.style.display = 'none';
            }
        });

        if (certCountNum) {
            certCountNum.textContent = matchingCount;
        }

        if (certEmptyState) {
            certEmptyState.style.display = (matchingCount === 0) ? 'block' : 'none';
        }

        if (certToggleBtn) {
            if (matchingCount <= 9) {
                certToggleBtn.style.display = 'none';
            } else {
                certToggleBtn.style.display = '';
            }
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
                    publishedCerts.sort((a, b) => {
                        const aFeat = (a.featured === true || a.featured === 'true');
                        const bFeat = (b.featured === true || b.featured === 'true');
                        if (aFeat && !bFeat) return -1;
                        if (!aFeat && bFeat) return 1;
                        return 0;
                    });
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

    async function loadProjectsFromJSON() {
        const projectGrid = document.querySelector('.project-grid');
        if (!projectGrid) return;
        try {
            const res = await fetch('data/projects.json');
            if (res.ok) {
                const projects = await res.json();
                if (projects && projects.length > 0) {
                    projectGrid.innerHTML = projects.map(proj => `
                        <div class="project-card case-study-card tilt-card" id="${proj.id}">
                            <div class="project-header">
                                <div class="project-title-group">
                                    <span class="status-badge ${proj.status.includes('Active') ? 'badge-in-dev' : 'badge-completed'}">${proj.badge || proj.status}</span>
                                    <h3>${proj.title}</h3>
                                </div>
                                <div class="project-links">
                                    ${proj.github ? `<a href="${proj.github}" target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository for ${proj.title}"><i class="fab fa-github"></i> Code</a>` : ''}
                                    ${proj.liveDemo ? `<a href="${proj.liveDemo}" target="_blank" rel="noopener noreferrer" aria-label="Live Demo for ${proj.title}"><i class="fas fa-external-link-alt"></i> Live Demo</a>` : ''}
                                </div>
                            </div>
                            <p class="project-summary">${proj.summary}</p>
                            <div class="case-study-details">
                                <div class="cs-field">
                                    <span class="cs-label"><i class="fas fa-exclamation-circle"></i> Problem:</span>
                                    <p>${proj.problem}</p>
                                </div>
                                <div class="cs-field">
                                    <span class="cs-label"><i class="fas fa-lightbulb"></i> Solution:</span>
                                    <p>${proj.solution}</p>
                                </div>
                                ${proj.contribution ? `
                                <div class="cs-field">
                                    <span class="cs-label"><i class="fas fa-user-cog"></i> My Contribution:</span>
                                    <p>${proj.contribution}</p>
                                </div>` : ''}
                            </div>
                            ${proj.verifiedResult ? `
                            <div class="verified-result-banner">
                                <i class="fas fa-award"></i> <strong>Verified Result:</strong> ${proj.verifiedResult}
                            </div>` : ''}
                            <div class="project-tech">
                                ${proj.techStack.map(t => `<span class="tech-tag">${t}</span>`).join('')}
                            </div>
                        </div>
                    `).join('');
                }
            }
        } catch (err) {
            console.warn('Dynamic fetch for projects.json skipped or failed; using static fallback', err);
        }
    }

    loadCertificatesFromJSON();
    loadProjectsFromJSON();
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

                const currentRadius = node.radius;

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

    /* ------------------------------------------------------------------
       Developer Command Palette (Cmd/Ctrl + K) & Toast
       ------------------------------------------------------------------ */
    const cmdModal = document.getElementById('cmd-palette-modal');
    const cmdTrigger = document.getElementById('cmd-k-trigger');
    const cmdInput = document.getElementById('cmd-palette-input');
    const cmdResults = document.getElementById('cmd-palette-results');
    const cmdBackdrop = document.getElementById('cmd-palette-backdrop');
    const cmdCloseBtn = document.getElementById('cmd-palette-close-btn');
    const cmdToast = document.getElementById('cmd-toast');

    let activeItemIndex = 0;
    let filteredCommands = [];

    const commandsList = [
        // Navigation Group
        { id: 'nav-hero', title: 'Home / Hero Overview', group: 'Navigation', icon: 'fas fa-home', action: () => scrollToSection('#hero') },
        { id: 'nav-about', title: 'About Me & Education', group: 'Navigation', icon: 'fas fa-user', action: () => scrollToSection('#about') },
        { id: 'nav-skills', title: 'Technical Skills & Architecture', group: 'Navigation', icon: 'fas fa-code', action: () => scrollToSection('#skills') },
        { id: 'nav-experience', title: 'Experience & Timeline', group: 'Navigation', icon: 'fas fa-briefcase', action: () => scrollToSection('#experience-education') },
        { id: 'nav-projects', title: 'Featured Engineering Projects', group: 'Navigation', icon: 'fas fa-layer-group', action: () => scrollToSection('#projects') },
        { id: 'nav-certifications', title: 'Certifications & Accreditations', group: 'Navigation', icon: 'fas fa-certificate', action: () => scrollToSection('#certificates') },
        { id: 'nav-achievements', title: 'Competitive Achievements', group: 'Navigation', icon: 'fas fa-trophy', action: () => scrollToSection('#achievements') },
        { id: 'nav-contact', title: 'Contact & Hire Me', group: 'Navigation', icon: 'fas fa-envelope', action: () => scrollToSection('#contact') },

        // Quick Actions Group
        { id: 'act-resume', title: 'Download Official Résumé', group: 'Quick Actions', icon: 'fas fa-file-download', shortcut: 'PDF', action: () => {
            const a = document.createElement('a');
            a.href = 'assets/resume.pdf';
            a.download = 'Shaik_Mahammad_Shariff_Resume.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast('Downloading official résumé PDF...');
        }},
        { id: 'act-copy-email', title: 'Copy Verified Email Address', group: 'Quick Actions', icon: 'fas fa-copy', shortcut: 'Copy', action: () => {
            const email = '23BQ1A04F2@vvit.net';
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(email).then(() => {
                    showToast('Copied ' + email + ' to clipboard!');
                }).catch(() => {
                    showToast('Email: ' + email);
                });
            } else {
                showToast('Email: ' + email);
            }
        }},
        { id: 'act-toggle-motion', title: 'Toggle Motion & Visual Effects', group: 'Quick Actions', icon: 'fas fa-magic', shortcut: 'Toggle', action: () => {
            const motionBtn = document.getElementById('btn-toggle-motion');
            if (motionBtn) motionBtn.click();
            showToast('Toggled visual motion effects');
        }},

        // External Links Group
        { id: 'link-github', title: 'GitHub Profile & Repositories', group: 'External Links', icon: 'fab fa-github', action: () => window.open('https://github.com/skmdshariff143-ai', '_blank') },
        { id: 'link-linkedin', title: 'LinkedIn Profile', group: 'External Links', icon: 'fab fa-linkedin-in', action: () => window.open('https://linkedin.com/in/mahammad-shariff-shaik-32903934a', '_blank') },
        { id: 'link-codechef', title: 'CodeChef 3-Star Profile', group: 'External Links', icon: 'fas fa-code', action: () => window.open('https://www.codechef.com/users/vvit23bq1a04f2', '_blank') }
    ];

    function showToast(msg) {
        if (!cmdToast) return;
        cmdToast.innerHTML = '<i class="fas fa-check-circle" style="color: var(--accent-teal);"></i> ' + msg;
        cmdToast.classList.add('active');
        setTimeout(() => {
            cmdToast.classList.remove('active');
        }, 3200);
    }

    function scrollToSection(selector) {
        const el = document.querySelector(selector);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function openCmdPalette() {
        if (!cmdModal) return;
        cmdModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        if (cmdInput) {
            cmdInput.value = '';
            cmdInput.focus();
        }
        renderCmdResults('');
    }

    function closeCmdPalette() {
        if (!cmdModal) return;
        cmdModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    function renderCmdResults(query) {
        if (!cmdResults) return;
        const q = (query || '').toLowerCase().trim();
        filteredCommands = commandsList.filter(cmd => {
            return cmd.title.toLowerCase().includes(q) || cmd.group.toLowerCase().includes(q);
        });

        if (filteredCommands.length === 0) {
            cmdResults.innerHTML = `
                <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
                    <i class="fas fa-search" style="margin-bottom: 0.5rem; font-size: 1.25rem; display: block;"></i>
                    No matching commands found for "${query}"
                </div>
            `;
            return;
        }

        activeItemIndex = 0;

        const groups = {};
        filteredCommands.forEach((cmd, idx) => {
            if (!groups[cmd.group]) groups[cmd.group] = [];
            groups[cmd.group].push({ cmd, originalIdx: idx });
        });

        let html = '';
        Object.keys(groups).forEach(groupName => {
            html += `<div class="cmd-palette-group-title">${groupName}</div>`;
            groups[groupName].forEach(({ cmd, originalIdx }) => {
                const isActive = originalIdx === activeItemIndex;
                html += `
                    <div class="cmd-palette-item ${isActive ? 'active' : ''}" data-idx="${originalIdx}" role="option" aria-selected="${isActive}">
                        <div class="cmd-palette-item-content">
                            <i class="${cmd.icon} cmd-palette-item-icon"></i>
                            <span>${cmd.title}</span>
                        </div>
                        ${cmd.shortcut ? `<span class="cmd-palette-item-shortcut">${cmd.shortcut}</span>` : ''}
                    </div>
                `;
            });
        });

        cmdResults.innerHTML = html;

        const items = cmdResults.querySelectorAll('.cmd-palette-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const idx = parseInt(item.dataset.idx, 10);
                executeCommand(idx);
            });
            item.addEventListener('mouseenter', () => {
                const idx = parseInt(item.dataset.idx, 10);
                updateActiveIndex(idx);
            });
        });
    }

    function updateActiveIndex(newIdx) {
        if (filteredCommands.length === 0) return;
        activeItemIndex = (newIdx + filteredCommands.length) % filteredCommands.length;
        const items = cmdResults.querySelectorAll('.cmd-palette-item');
        items.forEach(item => {
            const idx = parseInt(item.dataset.idx, 10);
            const isActive = idx === activeItemIndex;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-selected', isActive);
            if (isActive) {
                item.scrollIntoView({ block: 'nearest' });
            }
        });
    }

    function executeCommand(index) {
        if (filteredCommands[index]) {
            closeCmdPalette();
            filteredCommands[index].action();
        }
    }

    if (cmdTrigger) {
        cmdTrigger.addEventListener('click', openCmdPalette);
    }
    if (cmdBackdrop) {
        cmdBackdrop.addEventListener('click', closeCmdPalette);
    }
    if (cmdCloseBtn) {
        cmdCloseBtn.addEventListener('click', closeCmdPalette);
    }

    if (cmdInput) {
        cmdInput.addEventListener('input', (e) => {
            renderCmdResults(e.target.value);
        });
        cmdInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                updateActiveIndex(activeItemIndex + 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                updateActiveIndex(activeItemIndex - 1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                executeCommand(activeItemIndex);
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (cmdModal && cmdModal.style.display === 'flex') {
                closeCmdPalette();
            } else {
                openCmdPalette();
            }
        } else if (e.key === 'Escape' && cmdModal && cmdModal.style.display === 'flex') {
            closeCmdPalette();
        }
    });

});
