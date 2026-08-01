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
       6. Shariff's Anime-Style AI Guide Controller & Web Speech API
       ------------------------------------------------------------------ */
    // Artwork Configuration Constant: Set to true ONLY when artwork assets (assets/ai-guide/shariff-ai-guide.webp) are physically added.
    const ENABLE_AI_GUIDE_IMAGE_ARTWORK = false;

    const aiGuideWidget = document.getElementById('ai-guide-widget');
    const aiGuideCard = document.getElementById('ai-guide-card');
    const aiGuideUnminimizeBtn = document.getElementById('ai-guide-unminimize-btn');
    const aiGuideMinimizeBtn = document.getElementById('ai-guide-minimize-btn');
    const aiGuideCloseBtn = document.getElementById('ai-guide-close-btn');

    const aiGuideCssAvatar = document.getElementById('ai-guide-css-avatar');
    const aiGuideAvatarBox = document.getElementById('ai-guide-avatar-box');
    const aiGuideStateText = document.getElementById('ai-guide-state-text');
    const aiGuideLiveRegion = document.getElementById('ai-guide-live-region');

    const aiPlayBtn = document.getElementById('ai-play-btn');
    const aiPlayBtnText = document.getElementById('ai-play-btn-text');
    const aiPauseBtn = document.getElementById('ai-pause-btn');
    const aiPauseBtnText = document.getElementById('ai-pause-btn-text');
    const aiStopBtn = document.getElementById('ai-stop-btn');
    const aiMuteBtn = document.getElementById('ai-mute-btn');
    const aiMuteIcon = document.getElementById('ai-mute-icon');
    const aiTranscriptToggleBtn = document.getElementById('ai-transcript-toggle-btn');
    const aiTranscriptInline = document.getElementById('ai-guide-transcript-inline');
    const aiVoiceWarning = document.getElementById('ai-voice-warning');

    const scriptText = "Hello, and welcome to Shaik Mahammad Shariff’s portfolio. Shariff is an Electronics and Communication Engineering undergraduate with an interest in artificial intelligence, software development and practical problem solving. He builds projects using Python, machine learning and modern web technologies. His featured work includes CreditGuard AI and FarmaLink-AI. He is also an AWS Certified Cloud Practitioner and continues to develop his skills through technical projects, internships and structured learning. Shariff is currently open to internship and entry-level opportunities where he can contribute, learn and grow as an AI and software developer. You can explore his projects, skills, experience and certifications throughout this portfolio.";

    let isMuted = false;
    let isSpeaking = false;
    let currentUtterance = null;
    let selectedVoice = null;

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Announce to Screen Readers via Live Region
    function announceState(message) {
        if (aiGuideLiveRegion) {
            aiGuideLiveRegion.textContent = message;
        }
    }

    // Minimized State (sessionStorage with safe try/catch)
    function updateWidgetMinState() {
        if (!aiGuideCard || !aiGuideUnminimizeBtn) return;
        let isMinimized = false;
        try {
            const stored = sessionStorage.getItem('ai_guide_minimized');
            if (stored === null) {
                // Default to compact state on small mobile viewports (< 400px) if user hasn't chosen
                isMinimized = window.matchMedia('(max-width: 400px)').matches;
            } else {
                isMinimized = stored === 'true';
            }
        } catch (e) {
            console.warn('sessionStorage not available:', e);
            isMinimized = window.matchMedia('(max-width: 400px)').matches;
        }

        if (isMinimized) {
            aiGuideCard.hidden = true;
            aiGuideCard.style.display = 'none';
            aiGuideCard.setAttribute('aria-hidden', 'true');
            aiGuideUnminimizeBtn.hidden = false;
        } else {
            aiGuideCard.hidden = false;
            aiGuideCard.style.display = 'block';
            aiGuideCard.setAttribute('aria-hidden', 'false');
            aiGuideUnminimizeBtn.hidden = true;
        }
    }

    if (aiGuideMinimizeBtn) {
        aiGuideMinimizeBtn.addEventListener('click', () => {
            stopSpeech();
            try {
                sessionStorage.setItem('ai_guide_minimized', 'true');
            } catch (e) {}
            updateWidgetMinState();
            announceState("AI Guide minimized");
        });
    }

    if (aiGuideUnminimizeBtn) {
        aiGuideUnminimizeBtn.addEventListener('click', () => {
            try {
                sessionStorage.setItem('ai_guide_minimized', 'false');
            } catch (e) {}
            updateWidgetMinState();
            announceState("AI Guide opened");
        });
    }

    if (aiGuideCloseBtn) {
        aiGuideCloseBtn.addEventListener('click', () => {
            stopSpeech();
            if (aiGuideWidget) {
                aiGuideWidget.style.display = 'none';
            }
            announceState("AI Guide closed");
        });
    }

    // Web Speech API Voice Initialization
    function initSpeechSynthesis() {
        if (!('speechSynthesis' in window)) {
            if (aiVoiceWarning) aiVoiceWarning.style.display = 'block';
            if (aiTranscriptInline) aiTranscriptInline.style.display = 'block';
            if (aiPlayBtn) aiPlayBtn.disabled = true;
            return false;
        }

        const populateVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices && voices.length > 0) {
                selectedVoice = voices.find(v => (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))))
                             || voices.find(v => v.lang.startsWith('en'))
                             || voices[0];
            }
        };

        populateVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = populateVoices;
        }
        return true;
    }

    // Update Visual Speaking Animations
    function setSpeakingVisualState(speaking, paused = false) {
        isSpeaking = speaking;
        if (!aiGuideAvatarBox) return;

        if (prefersReducedMotion) {
            aiGuideAvatarBox.classList.remove('is-speaking', 'is-paused');
            if (aiGuideStateText) aiGuideStateText.textContent = speaking ? (paused ? 'Paused' : 'Speaking') : 'Ready';
            return;
        }

        if (speaking) {
            if (paused) {
                aiGuideAvatarBox.classList.remove('is-speaking');
                aiGuideAvatarBox.classList.add('is-paused');
                if (aiGuideStateText) aiGuideStateText.textContent = 'Paused';
            } else {
                aiGuideAvatarBox.classList.remove('is-paused');
                aiGuideAvatarBox.classList.add('is-speaking');
                if (aiGuideStateText) aiGuideStateText.textContent = 'Speaking...';
            }
        } else {
            aiGuideAvatarBox.classList.remove('is-speaking', 'is-paused');
            if (aiGuideStateText) aiGuideStateText.textContent = 'Ready';
        }
    }

    function playSpeech() {
        if (!('speechSynthesis' in window)) return;

        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            setSpeakingVisualState(true, false);
            if (aiPauseBtn) aiPauseBtn.disabled = false;
            if (aiPauseBtnText) aiPauseBtnText.textContent = 'Pause';
            if (aiStopBtn) aiStopBtn.disabled = false;
            announceState("Speech resumed");
            return;
        }

        window.speechSynthesis.cancel();

        currentUtterance = new SpeechSynthesisUtterance(scriptText);
        if (selectedVoice) currentUtterance.voice = selectedVoice;
        currentUtterance.rate = 1.0;
        currentUtterance.pitch = 1.0;
        currentUtterance.volume = isMuted ? 0 : 1.0;

        currentUtterance.onstart = () => {
            setSpeakingVisualState(true, false);
            if (aiPauseBtn) aiPauseBtn.disabled = false;
            if (aiPauseBtnText) aiPauseBtnText.textContent = 'Pause';
            if (aiStopBtn) aiStopBtn.disabled = false;
            if (aiPlayBtnText) aiPlayBtnText.textContent = 'Replay';
            announceState("AI Guide started speaking introduction");
        };

        currentUtterance.onend = () => {
            setSpeakingVisualState(false);
            if (aiPauseBtn) aiPauseBtn.disabled = true;
            if (aiStopBtn) aiStopBtn.disabled = true;
            if (aiPlayBtnText) aiPlayBtnText.textContent = 'Replay';
            announceState("Introduction speech completed");
        };

        currentUtterance.onerror = (e) => {
            console.warn('Speech synthesis playback note:', e);
            setSpeakingVisualState(false);
            if (aiPauseBtn) aiPauseBtn.disabled = true;
            if (aiStopBtn) aiStopBtn.disabled = true;
        };

        currentUtterance.onpause = () => {
            setSpeakingVisualState(true, true);
            if (aiPauseBtnText) aiPauseBtnText.textContent = 'Resume';
            announceState("Speech paused");
        };

        currentUtterance.onresume = () => {
            setSpeakingVisualState(true, false);
            if (aiPauseBtnText) aiPauseBtnText.textContent = 'Pause';
            announceState("Speech resumed");
        };

        window.speechSynthesis.speak(currentUtterance);
    }

    function pauseSpeech() {
        if (!('speechSynthesis' in window)) return;
        if (window.speechSynthesis.speaking) {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
                setSpeakingVisualState(true, false);
                if (aiPauseBtnText) aiPauseBtnText.textContent = 'Pause';
                announceState("Speech resumed");
            } else {
                window.speechSynthesis.pause();
                setSpeakingVisualState(true, true);
                if (aiPauseBtnText) aiPauseBtnText.textContent = 'Resume';
                announceState("Speech paused");
            }
        }
    }

    function stopSpeech() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setSpeakingVisualState(false);
        if (aiPauseBtn) aiPauseBtn.disabled = true;
        if (aiPauseBtnText) aiPauseBtnText.textContent = 'Pause';
        if (aiStopBtn) aiStopBtn.disabled = true;
        if (aiPlayBtnText) aiPlayBtnText.textContent = 'Play Intro';
        if (aiGuideStateText) aiGuideStateText.textContent = 'Stopped';
        announceState("Speech stopped");
    }

    function toggleMute() {
        isMuted = !isMuted;
        if (aiMuteIcon) {
            aiMuteIcon.className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
        }
        if (currentUtterance && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
            currentUtterance.volume = isMuted ? 0 : 1.0;
        }
        announceState(isMuted ? "Audio muted" : "Audio unmuted");
    }

    if (aiPlayBtn) aiPlayBtn.addEventListener('click', playSpeech);
    if (aiPauseBtn) aiPauseBtn.addEventListener('click', pauseSpeech);
    if (aiStopBtn) aiStopBtn.addEventListener('click', stopSpeech);
    if (aiMuteBtn) aiMuteBtn.addEventListener('click', toggleMute);

    if (aiTranscriptToggleBtn && aiTranscriptInline) {
        aiTranscriptToggleBtn.addEventListener('click', () => {
            const isShown = aiTranscriptInline.style.display !== 'none';
            aiTranscriptInline.style.display = isShown ? 'none' : 'block';
            announceState(isShown ? "Transcript hidden" : "Transcript shown");
        });
    }

    // Stop speech when tab is hidden or page is unloaded
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopSpeech();
        }
    });

    window.addEventListener('beforeunload', () => {
        stopSpeech();
    });

    window.addEventListener('pagehide', () => {
        stopSpeech();
    });

    updateWidgetMinState();
    initSpeechSynthesis();

    /* ------------------------------------------------------------------
       7. AI-Assisted Introduction Modal Controller
       ------------------------------------------------------------------ */
    const btnOpenIntro = document.getElementById('btn-open-intro');
    const btnCloseIntro = document.getElementById('btn-close-intro');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const introModal = document.getElementById('ai-intro-modal');
    let previouslyFocusedElement = null;

    if (introModal && btnOpenIntro) {
        const openModal = (e) => {
            previouslyFocusedElement = (document.activeElement && document.activeElement !== document.body)
                ? document.activeElement
                : btnOpenIntro;
            introModal.hidden = false;
            introModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';

            // Unminimize guide widget if user clicked hero intro button
            try {
                sessionStorage.removeItem('ai_guide_minimized');
            } catch (err) {}
            updateWidgetMinState();

            // Trigger single shared speech controller ONLY on direct user click event
            if (e && e.isTrusted) {
                playSpeech();
            }

            if (btnCloseIntro) {
                btnCloseIntro.focus();
            } else {
                const container = introModal.querySelector('.modal-container');
                if (container) container.focus();
            }
        };

        const closeModal = () => {
            stopSpeech();
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
                        formStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Oops! Something went wrong. Please try emailing me directly at <a href="mailto:sk.md.shariff143@gmail.com" style="color: var(--accent-teal); text-decoration: underline;">sk.md.shariff143@gmail.com</a> instead.';
                    }
                }
            } catch (error) {
                if (formStatus) {
                    formStatus.style.color = '#ff1744';
                    formStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Connection error. Please try emailing me directly at <a href="mailto:sk.md.shariff143@gmail.com" style="color: var(--accent-teal); text-decoration: underline;">sk.md.shariff143@gmail.com</a> instead.';
                }
            }
        });
    }
});
