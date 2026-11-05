/**
 * The AI Innovation Observatory — Interactions & Evidence Controller
 * Handles orbital node selection, pipeline updates, benchmarks, and keyboard/touch navigation.
 * Author: Shaik Mahammad Shariff Portfolio
 */

(function () {
    'use strict';

    function initObservatoryInteractions() {
        const nodeSelectorBtns = document.querySelectorAll('.observatory-node-btn');
        const evidenceTitle = document.getElementById('observatory-evidence-title');
        const evidenceSubtitle = document.getElementById('observatory-evidence-subtitle');
        const evidenceBadge = document.getElementById('observatory-evidence-badge');
        const evidenceList = document.getElementById('observatory-evidence-list');
        const pipelineList = document.getElementById('observatory-pipeline-list');
        const benchmarksList = document.getElementById('observatory-benchmarks-list');
        const actionsList = document.getElementById('observatory-actions-list');
        const liveRegion = document.getElementById('observatory-live-region');

        if (!nodeSelectorBtns.length) return;

        function updateEvidenceUI(nodeData, index) {
            if (!nodeData) return;

            // Update node selector buttons active states
            nodeSelectorBtns.forEach((btn, idx) => {
                const isSelected = idx === index;
                btn.classList.toggle('active', isSelected);
                btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
                btn.setAttribute('tabindex', isSelected ? '0' : '-1');
            });

            // Update Evidence Panel Content
            if (evidenceTitle) evidenceTitle.textContent = nodeData.name;
            if (evidenceSubtitle) evidenceSubtitle.textContent = nodeData.subtitle;
            if (evidenceBadge) {
                evidenceBadge.textContent = `Node ${index + 1} of 3 • ${nodeData.name}`;
                evidenceBadge.style.borderColor = nodeData.accentHex;
                evidenceBadge.style.color = nodeData.accentHex;
            }

            // Architecture Pipeline rendering
            if (pipelineList && nodeData.pipeline) {
                pipelineList.innerHTML = nodeData.pipeline.map(item => `
                    <div class="pipeline-step-item">
                        <div class="pipeline-step-num" style="color: ${nodeData.accentHex}; border-color: ${nodeData.accentHex}40">${item.step}</div>
                        <div class="pipeline-step-body">
                            <h5 class="pipeline-step-title">${item.title}</h5>
                            <p class="pipeline-step-desc">${item.desc}</p>
                        </div>
                    </div>
                `).join('');
            }

            // Production Benchmarks rendering
            if (benchmarksList && nodeData.benchmarks) {
                benchmarksList.innerHTML = nodeData.benchmarks.map(item => `
                    <div class="benchmark-card-item">
                        <div class="benchmark-header">
                            <span class="benchmark-title">${item.title}</span>
                            <span class="benchmark-metric" style="color: ${nodeData.accentHex}; background: ${nodeData.accentHex}15; border-color: ${nodeData.accentHex}30">${item.metric}</span>
                        </div>
                        <p class="benchmark-note">${item.note}</p>
                    </div>
                `).join('');
            }

            // Quick Actions rendering
            if (actionsList && nodeData.actions) {
                actionsList.innerHTML = nodeData.actions.map(action => `
                    <a href="${action.href}" class="btn ${action.isPrimary ? 'btn-primary' : 'btn-secondary'} btn-sm observatory-action-link" ${action.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>
                        <i class="${action.icon}"></i> ${action.label}
                    </a>
                `).join('');
            }

            // Backward-compatible fallback for evidence list only if pipeline is not present
            if (!pipelineList && evidenceList && nodeData.proofs) {
                evidenceList.innerHTML = nodeData.proofs.map(item => `
                    <div class="evidence-card-item">
                        <div class="evidence-item-icon" style="color: ${nodeData.accentHex}">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="evidence-item-content">
                            <h4 class="evidence-item-title">${item.title}</h4>
                            <p class="evidence-item-desc">${item.desc}</p>
                        </div>
                    </div>
                `).join('');
            }

            // Screen reader announcement
            if (liveRegion) {
                liveRegion.textContent = `Selected evidence node: ${nodeData.name}. ${nodeData.subtitle}`;
            }
        }

        // Click & Focus handlers for Node Selector Buttons
        nodeSelectorBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                if (window.ObservatoryScene && typeof window.ObservatoryScene.selectNode === 'function') {
                    window.ObservatoryScene.selectNode(index);
                } else if (window.ObservatoryScene && window.ObservatoryScene.nodesData) {
                    updateEvidenceUI(window.ObservatoryScene.nodesData[index], index);
                }
            });

            btn.addEventListener('mouseenter', () => {
                if (window.ObservatoryScene && typeof window.ObservatoryScene.selectNode === 'function') {
                    window.ObservatoryScene.selectNode(index);
                }
            });
        });

        // Sync with custom 3D scene event
        window.addEventListener('observatory-node-change', (e) => {
            if (e.detail && e.detail.data) {
                updateEvidenceUI(e.detail.data, e.detail.index);
            }
        });

        // Keyboard Navigation Support (Arrow keys, 1-3 keys)
        const container = document.getElementById('observatory-node-selector');
        if (container) {
            container.addEventListener('keydown', (e) => {
                let currentIndex = 0;
                nodeSelectorBtns.forEach((btn, idx) => {
                    if (btn.classList.contains('active')) currentIndex = idx;
                });

                let nextIndex = currentIndex;
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    nextIndex = (currentIndex + 1) % nodeSelectorBtns.length;
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    nextIndex = (currentIndex - 1 + nodeSelectorBtns.length) % nodeSelectorBtns.length;
                } else if (e.key >= '1' && e.key <= '3') {
                    e.preventDefault();
                    nextIndex = parseInt(e.key, 10) - 1;
                }

                if (nextIndex !== currentIndex) {
                    nodeSelectorBtns[nextIndex].focus();
                    if (window.ObservatoryScene && typeof window.ObservatoryScene.selectNode === 'function') {
                        window.ObservatoryScene.selectNode(nextIndex);
                    }
                }
            });
        }

        // Initialize with default node 0
        if (window.ObservatoryScene && window.ObservatoryScene.nodesData) {
            updateEvidenceUI(window.ObservatoryScene.nodesData[0], 0);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initObservatoryInteractions);
    } else {
        initObservatoryInteractions();
    }
})();
