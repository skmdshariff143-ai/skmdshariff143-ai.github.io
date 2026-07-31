/**
 * The AI Innovation Observatory — Scroll & Portfolio Motion Module
 * Manages scroll-driven scene progression, section entry transitions, and motion accessibility.
 * Author: Shaik Mahammad Shariff Portfolio
 */

(function () {
    'use strict';

    function initPortfolioMotion() {
        const sections = document.querySelectorAll('section[id]');
        const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        // Manual Effect Toggle Button (High / Reduced Effects)
        const effectToggleBtn = document.getElementById('btn-toggle-motion') || document.getElementById('btn-toggle-effects');
        let manualReducedMotion = false;

        try {
            const savedSetting = localStorage.getItem('portfolio_reduced_motion');
            if (savedSetting !== null) {
                manualReducedMotion = savedSetting === 'true';
            }
        } catch (e) {}

        function applyMotionPreferences() {
            const isReduced = reduceMotionQuery.matches || manualReducedMotion;
            document.body.classList.toggle('reduce-motion-active', isReduced);

            if (effectToggleBtn) {
                effectToggleBtn.setAttribute('aria-pressed', isReduced ? 'true' : 'false');
                const label = effectToggleBtn.querySelector('#motion-toggle-text') || effectToggleBtn.querySelector('.effect-btn-label');
                if (label) {
                    label.textContent = isReduced ? 'Motion Effects: Off' : 'Motion Effects: On';
                }
            }
        }


        if (effectToggleBtn) {
            effectToggleBtn.addEventListener('click', () => {
                manualReducedMotion = !manualReducedMotion;
                try {
                    localStorage.setItem('portfolio_reduced_motion', manualReducedMotion ? 'true' : 'false');
                } catch (e) {}
                applyMotionPreferences();
            });
        }

        reduceMotionQuery.addEventListener('change', applyMotionPreferences);
        applyMotionPreferences();

        // Scroll Observer for Section Progression
        if ('IntersectionObserver' in window) {
            const sectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const sectionId = entry.target.getAttribute('id');
                        document.body.setAttribute('data-active-section', sectionId);

                        // Signal section change to Observatory scene
                        window.dispatchEvent(new CustomEvent('portfolio-section-active', {
                            detail: { sectionId: sectionId }
                        }));
                    }
                });
            }, { threshold: 0.3 });

            sections.forEach(sec => sectionObserver.observe(sec));

            // Scroll Reveal for Cards and Content
            const revealElements = document.querySelectorAll('.card, .section-title, .timeline-item, .skill-group');
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('reveal-visible');
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

            revealElements.forEach(el => {
                el.classList.add('reveal-on-scroll');
                revealObserver.observe(el);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPortfolioMotion);
    } else {
        initPortfolioMotion();
    }
})();
