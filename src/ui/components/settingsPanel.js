import { BaseComponent } from './BaseComponent.js';

export class SettingsPanel extends BaseComponent {
    constructor(element, options = {}) {
        super(element, options);
        this.gameState = options.gameState;
        this.lastActiveTab = null; // remember which tab was active between refreshes
    }

    static generateSettingsHTML(gameState) {
        let html = '<div id="settingsPanelInner">';
        let tabCount = 0;

        function generateCategoryHTML(categoryObj, parentKey = '') {
            for (let key in categoryObj) {
                const fullKey = parentKey ? `${parentKey}.${key}` : key;
                const value = categoryObj[key];
                const terms = fullKey.split('.');
                const finalTerm = terms[terms.length - 1];
                if (typeof value === 'object') {
                    html += `<div class="ui-section">`;
                    html += `<h3 class="category-toggle">${finalTerm}</h3>`;
                    generateCategoryHTML(value, fullKey);
                    html += `</div>`;
                } else {
                    html += `<div class="ui-item">`;
                    const isGroundType = parentKey.includes('groundProperties');
                    const isWeatherType = parentKey.includes('weatherProperties');
                    const isThirdType = parentKey.includes('thirdProperties');

                    if (isGroundType || isWeatherType || isThirdType) {
                        html += `<label for="${fullKey}">${finalTerm}:</label>`;
                        html += `<input class="settings-input" type="text" id="${fullKey}" value="${value}" autocomplete="off" tabindex="${tabCount}">`;
                    } else {
                        html += `<label for="${fullKey}">${finalTerm}:</label>`;
                        html += `<input class="settings-input" type="number" id="${fullKey}" value="${value}" step="1" autocomplete="off" tabindex="${tabCount}">`;
                    }
                    html += `</div>`;
                    tabCount++;
                }
            }
        }

        generateCategoryHTML(gameState.settings);
        html += '</div>';
        return html;
    }

    refresh(gameState) {
        if (!gameState) {
            console.error("SettingsPanel.refresh requires gameState.");
            return;
        }
        const settingsContainer = this.element;
        if (settingsContainer) {
            // preserve currently active tab id (if any)
            const currentActive = settingsContainer.querySelector('.tab-button.active');
            if (currentActive) {
                this.lastActiveTab = currentActive.dataset.tab;
            }
            settingsContainer.innerHTML = SettingsPanel.generateSettingsHTML(gameState);
            this.buildLocalTabs(); // add tabs for top-level sections
        }
    }

    buildLocalTabs() {
        const root = this.element.querySelector('#settingsPanelInner');
        if (!root) return;
        const sections = Array.from(root.children).filter(el => el.classList.contains('ui-section'));
        if (sections.length === 0) return;

        const tabs = document.createElement('div'); tabs.className = 'tabs';
        const btns = document.createElement('div'); btns.className = 'tab-buttons';
        const content = document.createElement('div'); content.className = 'tab-content';

        sections.forEach((sec, i) => {
            const title = (sec.querySelector('.category-toggle')?.textContent || `Section ${i+1}`).trim();
            const panel = document.createElement('div'); panel.className = 'tab-panel'; panel.dataset.tabPanel = `sp-${i}`;
            panel.appendChild(sec); // move section into panel
            const btn = document.createElement('button'); btn.className = 'tab-button'; btn.dataset.tab = `sp-${i}`; btn.textContent = title;
            btns.appendChild(btn); content.appendChild(panel);
        });

        root.innerHTML = ''; tabs.appendChild(btns); tabs.appendChild(content); root.appendChild(tabs);

        // determine which tab to activate: previously stored or default to first
        const targetTab = this.lastActiveTab || (btns.querySelector('.tab-button')?.dataset.tab);
        if (targetTab) {
            btns.querySelectorAll('.tab-button').forEach(x => x.classList.toggle('active', x.dataset.tab === targetTab));
            content.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.tabPanel === targetTab));
        } else {
            // fallback: activate first
            const firstBtn = btns.querySelector('.tab-button'); const firstPanel = content.querySelector('.tab-panel');
            if (firstBtn && firstPanel) { firstBtn.classList.add('active'); firstPanel.classList.add('active'); }
        }

        // simple tab handler (local only)
        btns.addEventListener('click', (e) => {
            const b = e.target.closest('.tab-button'); if (!b) return;
            btns.querySelectorAll('.tab-button').forEach(x => x.classList.remove('active'));
            content.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            b.classList.add('active');
            const panel = content.querySelector(`.tab-panel[data-tab-panel="${b.dataset.tab}"]`);
            if (panel) panel.classList.add('active');
            // remember selection so future refreshes keep this tab
            this.lastActiveTab = b.dataset.tab;
        });
    }
}