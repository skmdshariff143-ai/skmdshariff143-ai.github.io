document.addEventListener('DOMContentLoaded', () => {
    /* ----------------------------------------------------------------------
       Mobile Navigation Toggle
       ---------------------------------------------------------------------- */
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            // Toggle hamburger icon (bars to times)
            const icon = hamburger.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when a link is clicked
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = hamburger.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
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
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
        } else {
            navbar.style.boxShadow = 'none';
            navbar.style.background = 'rgba(10, 10, 10, 0.8)';
        }

        // Active Link Highlight
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href').includes(current) && current !== '') {
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
       Certificate Modal / Lightbox
       ------------------------------------------------------------------ */
    const certModal = document.getElementById('cert-modal');
    const certModalImg = document.getElementById('cert-modal-img');
    const certModalClose = document.getElementById('cert-modal-close');

    // Open modal on expand button or image click
    document.querySelectorAll('.cert-card .cert-preview').forEach(preview => {
        preview.addEventListener('click', () => {
            const img = preview.querySelector('img');
            if (img && certModal) {
                certModalImg.src = img.src;
                certModalImg.alt = img.alt;
                certModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    if (certModalClose) {
        certModalClose.addEventListener('click', () => {
            certModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (certModal) {
        certModal.addEventListener('click', (e) => {
            if (e.target === certModal) {
                certModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && certModal && certModal.classList.contains('active')) {
            certModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    /* ------------------------------------------------------------------
       Certificate Filter Buttons
       ------------------------------------------------------------------ */
    const filterBtns = document.querySelectorAll('.cert-filters .filter-btn');
    const certCards = document.querySelectorAll('.cert-card');
    const certCountEl = document.querySelector('.cert-count span');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            let visibleCount = 0;

            certCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = '';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            if (certCountEl) {
                certCountEl.textContent = visibleCount;
            }
        });
    });
});
